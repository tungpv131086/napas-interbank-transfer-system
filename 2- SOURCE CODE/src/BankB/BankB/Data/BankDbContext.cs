using Microsoft.EntityFrameworkCore;
using BankB.Models;

namespace BankB.Data;

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
            new Account { Id = 1, AccountNumber = "BANKB001", AccountHolderName = "Alice Williams", Balance = 100000 },
            new Account { Id = 2, AccountNumber = "BANKB002", AccountHolderName = "Charlie Brown", Balance = 50000 },
            new Account { Id = 3, AccountNumber = "BANKB003", AccountHolderName = "Diana Prince", Balance = 75000 }
        );
    }
}
