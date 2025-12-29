using Microsoft.EntityFrameworkCore;
using AuthService.Models;

namespace AuthService.Data;

public class AuthDbContext : DbContext
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Seed hardcoded users for demo
        modelBuilder.Entity<User>().HasData(
            new User { Id = 1, Username = "user_banka", Password = "pass123", BankCode = "BANKA", Role = "User" },
            new User { Id = 2, Username = "user_bankb", Password = "pass123", BankCode = "BANKB", Role = "User" },
            new User { Id = 3, Username = "user_bankc", Password = "pass123", BankCode = "BANKC", Role = "User" },
            new User { Id = 4, Username = "admin", Password = "admin123", BankCode = "NAPAS", Role = "Admin" }
        );
    }
}
