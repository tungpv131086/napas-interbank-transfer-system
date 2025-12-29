using Microsoft.EntityFrameworkCore;
using BankA.Models;

namespace BankA.Data;

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
            new Account { Id = 1, AccountNumber = "BANKA001", AccountHolderName = "John Doe", Balance = 100000 },
            new Account { Id = 2, AccountNumber = "BANKA002", AccountHolderName = "Jane Smith", Balance = 50000 },
            new Account { Id = 3, AccountNumber = "BANKA003", AccountHolderName = "Bob Johnson", Balance = 75000 }
        );
    }
}
