using Microsoft.EntityFrameworkCore;
using BankC.Models;

namespace BankC.Data;

public class BankDbContext : DbContext
{
    public BankDbContext(DbContextOptions<BankDbContext> options) : base(options)
    {
    }

    public DbSet<Account> Accounts { get; set; }
    public DbSet<Transaction> Transactions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Seed demo accounts for Bank A
        modelBuilder.Entity<Account>().HasData(
            new Account { Id = 1, AccountNumber = "BANKC001", AccountHolderName = "Eve Anderson", Balance = 100000 },
            new Account { Id = 2, AccountNumber = "BANKC002", AccountHolderName = "Frank Miller", Balance = 50000 },
            new Account { Id = 3, AccountNumber = "BANKC003", AccountHolderName = "Grace Lee", Balance = 75000 }
        );
    }
}
