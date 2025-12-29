using Microsoft.EntityFrameworkCore;
using NapasService.Data;
using NapasService.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<NapasDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHostedService<TransferRouterService>();
builder.Services.AddHostedService<ResultProcessorService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<NapasDbContext>();

        // Ensure database and tables are created
        var created = db.Database.EnsureCreated();
        Console.WriteLine(created ? "✓ NAPAS database created" : "✓ NAPAS database already exists");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"✗ NAPAS database initialization error: {ex.Message}");
        throw;
    }
}

app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Get all transactions
app.MapGet("/api/transactions", async (NapasDbContext db) =>
{
    var transactions = await db.Transactions
        .OrderByDescending(t => t.CreatedAt)
        .Take(100)
        .ToListAsync();
    return Results.Ok(transactions);
});

// Get transaction by ID
app.MapGet("/api/transactions/{transactionId}", async (string transactionId, NapasDbContext db) =>
{
    var transaction = await db.Transactions
        .FirstOrDefaultAsync(t => t.TransactionId == transactionId);
    return transaction != null ? Results.Ok(transaction) : Results.NotFound();
});

// Get reconciliation records
app.MapGet("/api/reconciliation", async (NapasDbContext db) =>
{
    var records = await db.ReconciliationRecords
        .OrderByDescending(r => r.RecordedAt)
        .Take(100)
        .ToListAsync();
    return Results.Ok(records);
});

// Get statistics
app.MapGet("/api/statistics", async (NapasDbContext db) =>
{
    var today = DateTime.UtcNow.Date;

    var totalTransactions = await db.Transactions.CountAsync();
    var todayTransactions = await db.Transactions.CountAsync(t => t.CreatedAt >= today);
    var successfulTransactions = await db.Transactions.CountAsync(t => t.Status == "SUCCESS");
    var pendingTransactions = await db.Transactions.CountAsync(t => t.Status == "PENDING");
    var failedTransactions = await db.Transactions.CountAsync(t => t.Status == "FAILED");
    var totalVolume = await db.Transactions
        .Where(t => t.Status == "SUCCESS")
        .SumAsync(t => t.Amount);

    return Results.Ok(new
    {
        totalTransactions,
        todayTransactions,
        successfulTransactions,
        pendingTransactions,
        failedTransactions,
        totalVolume
    });
});

// Health check
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "napas" }));

app.Run();
