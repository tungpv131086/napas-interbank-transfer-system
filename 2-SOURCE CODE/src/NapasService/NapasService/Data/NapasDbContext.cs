using Microsoft.EntityFrameworkCore;
using NapasService.Models;

namespace NapasService.Data;

public class NapasDbContext : DbContext
{
    public NapasDbContext(DbContextOptions<NapasDbContext> options) : base(options)
    {
    }

    public DbSet<NapasTransaction> Transactions { get; set; }
    public DbSet<ReconciliationRecord> ReconciliationRecords { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<NapasTransaction>()
            .HasIndex(t => t.TransactionId)
            .IsUnique();
    }
}
