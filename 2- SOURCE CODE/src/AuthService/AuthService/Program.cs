using Microsoft.EntityFrameworkCore;
using AuthService.Data;
using AuthService.Services;
using AuthService.DTOs;
using AuthService.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddSingleton<JwtService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Ensure database is created and seed data
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();

        // Ensure database and tables are created
        var created = db.Database.EnsureCreated();
        Console.WriteLine(created ? "✓ Auth database created" : "✓ Auth database already exists");

        // Wait a moment for database to be fully ready
        System.Threading.Thread.Sleep(500);

        // Try to seed users
        try
        {
            var count = db.Users.Count();
            if (count == 0)
            {
                db.Users.AddRange(
                    new AuthService.Models.User { Username = "user_banka", Password = "pass123", BankCode = "BANKA", Role = "User" },
                    new AuthService.Models.User { Username = "user_bankb", Password = "pass123", BankCode = "BANKB", Role = "User" },
                    new AuthService.Models.User { Username = "user_bankc", Password = "pass123", BankCode = "BANKC", Role = "User" },
                    new AuthService.Models.User { Username = "admin", Password = "admin123", BankCode = "NAPAS", Role = "Admin" }
                );
                db.SaveChanges();
                Console.WriteLine($"✓ Seeded 4 demo users");
            }
            else
            {
                Console.WriteLine($"✓ Users already exist (count: {count})");
            }
        }
        catch (Exception seedEx)
        {
            Console.WriteLine($"⚠ Seeding skipped: {seedEx.Message}");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"✗ Auth database initialization error: {ex.Message}");
        throw;
    }
}

app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Login endpoint
app.MapPost("/api/auth/login", async (LoginRequest request, AuthDbContext db, JwtService jwtService) =>
{
    var user = await db.Users.FirstOrDefaultAsync(u =>
        u.Username == request.Username && u.Password == request.Password);

    if (user == null)
    {
        return Results.Unauthorized();
    }

    var token = jwtService.GenerateToken(user.Username, user.BankCode, user.Role);
    return Results.Ok(new LoginResponse(token, user.BankCode, user.Username, user.Role));
});

// Get all users (for demo purposes)
app.MapGet("/api/auth/users", async (AuthDbContext db) =>
{
    var users = await db.Users.Select(u => new { u.Username, u.BankCode, u.Role }).ToListAsync();
    return Results.Ok(users);
});

// Admin: Create tables if not exist
app.MapPost("/api/auth/admin/create-tables", (AuthDbContext db) =>
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

// Admin: Seed sample users
app.MapPost("/api/auth/admin/seed", async (AuthDbContext db) =>
{
    try
    {
        // Check if users already exist
        if (db.Users.Any())
        {
            return Results.BadRequest(new { error = "Users already exist. Use reset first if you want to reseed." });
        }

        // Seed demo users
        db.Users.AddRange(
            new User { Username = "user_banka", Password = "pass123", BankCode = "BANKA", Role = "User" },
            new User { Username = "user_bankb", Password = "pass123", BankCode = "BANKB", Role = "User" },
            new User { Username = "user_bankc", Password = "pass123", BankCode = "BANKC", Role = "User" }
        );
        await db.SaveChangesAsync();

        return Results.Ok(new { message = "Successfully seeded 3 demo users", count = 3 });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error seeding data: {ex.Message}");
    }
});

// Admin: Reset all users
app.MapPost("/api/auth/admin/reset", async (AuthDbContext db) =>
{
    try
    {
        // Delete all users
        db.Users.RemoveRange(db.Users);
        await db.SaveChangesAsync();

        return Results.Ok(new { message = "Successfully reset all users", usersDeleted = true });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error resetting data: {ex.Message}");
    }
});

// Health check
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "auth" }));

app.Run();
