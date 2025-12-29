using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using BankA.Data;
using BankA.DTOs;
using BankA.Models;
using BankA.Services;
using BankA.Hubs;
using Shared.Models;
using Shared.RabbitMQ;
using RabbitMQ.Client;

var builder = WebApplication.CreateBuilder(args);

var bankCode = Environment.GetEnvironmentVariable("Bank__Code") ?? "BANKA";
var rabbitMqHost = Environment.GetEnvironmentVariable("RabbitMQ__Host") ?? "rabbitmq";

builder.Services.AddDbContext<BankDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHostedService<TransferConsumerService>();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173", "http://localhost:8080")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Ensure database is created with seed data
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<BankDbContext>();

        // Ensure database and tables are created
        var created = db.Database.EnsureCreated();
        Console.WriteLine(created ? $"✓ Database created for {bankCode}" : $"✓ Database already exists for {bankCode}");

        // Add ErrorMessage column if it doesn't exist (migration)
        try
        {
            db.Database.ExecuteSqlRaw(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'Transactions' AND column_name = 'ErrorMessage'
                    ) THEN
                        ALTER TABLE ""Transactions"" ADD COLUMN ""ErrorMessage"" text NULL;
                    END IF;
                END $$;
            ");
            Console.WriteLine($"✓ ErrorMessage column ensured for {bankCode}");
        }
        catch (Exception migEx)
        {
            Console.WriteLine($"⚠ Migration warning for {bankCode}: {migEx.Message}");
        }

        // Wait a moment for database to be fully ready
        System.Threading.Thread.Sleep(500);

        // Try to seed accounts
        try
        {
            var count = db.Accounts.Count();
            if (count == 0)
            {
                db.Accounts.AddRange(
                    new Account { AccountNumber = "BANKA001", AccountHolderName = "John Doe", Balance = 100000, CreatedAt = DateTime.UtcNow },
                    new Account { AccountNumber = "BANKA002", AccountHolderName = "Jane Smith", Balance = 50000, CreatedAt = DateTime.UtcNow },
                    new Account { AccountNumber = "BANKA003", AccountHolderName = "Bob Johnson", Balance = 75000, CreatedAt = DateTime.UtcNow }
                );
                db.SaveChanges();
                Console.WriteLine($"✓ Seeded 3 demo accounts for {bankCode}");
            }
            else
            {
                Console.WriteLine($"✓ Accounts already exist for {bankCode} (count: {count})");
            }
        }
        catch (Exception seedEx)
        {
            Console.WriteLine($"⚠ Seeding skipped for {bankCode}: {seedEx.Message}");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"✗ Database initialization error for {bankCode}: {ex.Message}");
        throw;
    }
}

app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Map SignalR hub
app.MapHub<BalanceHub>("/balanceHub");

// Get all accounts
app.MapGet("/api/accounts", async (BankDbContext db) =>
{
    var accounts = await db.Accounts.ToListAsync();
    return Results.Ok(accounts);
});

// Get account by number
app.MapGet("/api/accounts/{accountNumber}", async (string accountNumber, BankDbContext db) =>
{
    var account = await db.Accounts.FirstOrDefaultAsync(a => a.AccountNumber == accountNumber);
    return account != null ? Results.Ok(account) : Results.NotFound();
});

// Get transactions for an account
app.MapGet("/api/accounts/{accountNumber}/transactions", async (string accountNumber, BankDbContext db) =>
{
    var transactions = await db.Transactions
        .Where(t => t.FromAccountNumber == accountNumber || t.ToAccountNumber == accountNumber)
        .OrderByDescending(t => t.CreatedAt)
        .ToListAsync();
    return Results.Ok(transactions);
});

// Internal transfer (same bank)
app.MapPost("/api/transfer/internal", async (TransferRequest request, BankDbContext db, IHubContext<BalanceHub> hubContext) =>
{
    if (request.Amount <= 0)
        return Results.BadRequest("Invalid amount");

    var fromAccount = await db.Accounts.FirstOrDefaultAsync(a => a.AccountNumber == request.FromAccountNumber);
    var toAccount = await db.Accounts.FirstOrDefaultAsync(a => a.AccountNumber == request.ToAccountNumber);

    if (fromAccount == null || toAccount == null)
        return Results.NotFound("Account not found");

    if (fromAccount.Balance < request.Amount)
        return Results.BadRequest("Insufficient balance");

    fromAccount.Balance -= request.Amount;
    toAccount.Balance += request.Amount;

    var transaction = new Transaction
    {
        TransactionId = Guid.NewGuid().ToString(),
        FromAccountNumber = request.FromAccountNumber,
        ToAccountNumber = request.ToAccountNumber,
        Amount = request.Amount,
        Description = request.Description,
        Type = "INTERNAL",
        Status = TransferStatus.Success,
        CompletedAt = DateTime.UtcNow
    };

    db.Transactions.Add(transaction);
    await db.SaveChangesAsync();

    // Broadcast real-time balance updates
    await hubContext.Clients.Group(fromAccount.AccountNumber).SendAsync("BalanceUpdated", new
    {
        accountNumber = fromAccount.AccountNumber,
        balance = fromAccount.Balance,
        transactionId = transaction.TransactionId
    });

    await hubContext.Clients.Group(toAccount.AccountNumber).SendAsync("BalanceUpdated", new
    {
        accountNumber = toAccount.AccountNumber,
        balance = toAccount.Balance,
        transactionId = transaction.TransactionId
    });

    return Results.Ok(new { message = "Transfer successful", transactionId = transaction.TransactionId });
});

// Interbank transfer (via NAPAS)
app.MapPost("/api/transfer/interbank", async (TransferRequest request, BankDbContext db, IHubContext<BalanceHub> hubContext) =>
{
    if (request.Amount <= 0)
        return Results.BadRequest("Invalid amount");

    if (string.IsNullOrEmpty(request.ToBankCode))
        return Results.BadRequest("Destination bank code required");

    var fromAccount = await db.Accounts.FirstOrDefaultAsync(a => a.AccountNumber == request.FromAccountNumber);

    if (fromAccount == null)
        return Results.NotFound("Source account not found");

    if (fromAccount.Balance < request.Amount)
        return Results.BadRequest("Insufficient balance");

    // Deduct from sender immediately
    fromAccount.Balance -= request.Amount;

    var transactionId = Guid.NewGuid().ToString();
    var transaction = new Transaction
    {
        TransactionId = transactionId,
        FromAccountNumber = request.FromAccountNumber,
        ToAccountNumber = request.ToAccountNumber,
        ToBankCode = request.ToBankCode,
        Amount = request.Amount,
        Description = request.Description,
        Type = "INTERBANK",
        Status = TransferStatus.Pending
    };

    db.Transactions.Add(transaction);
    await db.SaveChangesAsync();

    // Broadcast sender balance update
    await hubContext.Clients.Group(fromAccount.AccountNumber).SendAsync("BalanceUpdated", new
    {
        accountNumber = fromAccount.AccountNumber,
        balance = fromAccount.Balance,
        transactionId = transactionId
    });

    // Send to NAPAS via RabbitMQ
    try
    {
        var helper = new RabbitMqHelper(rabbitMqHost);
        using var connection = helper.CreateConnection();
        using var channel = connection.CreateModel();

        var transferMessage = new TransferMessage
        {
            TransactionId = transactionId,
            FromBankCode = bankCode,
            ToBankCode = request.ToBankCode,
            FromAccountNumber = request.FromAccountNumber,
            ToAccountNumber = request.ToAccountNumber,
            Amount = request.Amount,
            Description = request.Description,
            Status = TransferStatus.Pending
        };

        helper.PublishMessage(channel, "transfer_napas", transferMessage);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error sending to NAPAS: {ex.Message}");
    }

    return Results.Ok(new { message = "Transfer request sent to NAPAS", transactionId });
});

// Admin: Create tables if not exist
app.MapPost("/api/admin/create-tables", (BankDbContext db) =>
{
    try
    {
        // Ensure database and tables are created
        var created = db.Database.EnsureCreated();

        if (created)
        {
            return Results.Ok(new { message = "Database and tables created successfully", created = true });
        }
        else
        {
            return Results.Ok(new { message = "Database and tables already exist", created = false });
        }
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error creating tables: {ex.Message}");
    }
});

// Admin: Seed sample data (replaces all existing data)
app.MapPost("/api/admin/seed", async (BankDbContext db) =>
{
    try
    {
        // Delete all existing data
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"Transactions\"");
        await db.Database.ExecuteSqlRawAsync("DELETE FROM \"Accounts\"");

        // Seed demo accounts
        db.Accounts.AddRange(
            new Account { AccountNumber = "BANKA001", AccountHolderName = "John Doe", Balance = 100000, CreatedAt = DateTime.UtcNow },
            new Account { AccountNumber = "BANKA002", AccountHolderName = "Jane Smith", Balance = 50000, CreatedAt = DateTime.UtcNow },
            new Account { AccountNumber = "BANKA003", AccountHolderName = "Bob Johnson", Balance = 75000, CreatedAt = DateTime.UtcNow }
        );
        await db.SaveChangesAsync();

        return Results.Ok(new { message = "Successfully seeded 3 demo accounts", count = 3 });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error seeding data: {ex.Message}");
    }
});

// Admin: Reset (recreate tables + seed data)
app.MapPost("/api/admin/reset", async (BankDbContext db) =>
{
    try
    {
        // Drop all tables using raw SQL to avoid EF schema issues
        await db.Database.ExecuteSqlRawAsync("DROP TABLE IF EXISTS \"Transactions\" CASCADE");
        await db.Database.ExecuteSqlRawAsync("DROP TABLE IF EXISTS \"Accounts\" CASCADE");

        // Recreate with new schema
        var created = await db.Database.EnsureCreatedAsync();

        // Seed demo accounts
        db.Accounts.AddRange(
            new Account { AccountNumber = "BANKA001", AccountHolderName = "John Doe", Balance = 100000, CreatedAt = DateTime.UtcNow },
            new Account { AccountNumber = "BANKA002", AccountHolderName = "Jane Smith", Balance = 50000, CreatedAt = DateTime.UtcNow },
            new Account { AccountNumber = "BANKA003", AccountHolderName = "Bob Johnson", Balance = 75000, CreatedAt = DateTime.UtcNow }
        );
        await db.SaveChangesAsync();

        return Results.Ok(new { message = "Successfully reset database and seeded data", tablesRecreated = true, accountsSeeded = 3 });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error resetting database: {ex.Message}");
    }
});

// Admin: Recreate database (wipe all tables and data, recreate tables only)
app.MapPost("/api/admin/recreate-database", async (BankDbContext db) =>
{
    try
    {
        // Drop all tables using raw SQL to avoid EF schema issues
        await db.Database.ExecuteSqlRawAsync("DROP TABLE IF EXISTS \"Transactions\" CASCADE");
        await db.Database.ExecuteSqlRawAsync("DROP TABLE IF EXISTS \"Accounts\" CASCADE");

        // Recreate with new schema
        var created = await db.Database.EnsureCreatedAsync();

        return Results.Ok(new { message = "Database tables recreated successfully (no data seeded)", tablesRecreated = true });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error recreating database: {ex.Message}");
    }
});

// Health check
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "bank-a", bankCode }));

app.Run();
