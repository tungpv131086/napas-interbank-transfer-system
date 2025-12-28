namespace BankC.Models;

public class Transaction
{
    public int Id { get; set; }
    public string TransactionId { get; set; } = Guid.NewGuid().ToString();
    public string FromAccountNumber { get; set; } = string.Empty;
    public string ToAccountNumber { get; set; } = string.Empty;
    public string? ToBankCode { get; set; }
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = "INTERNAL"; // INTERNAL, INTERBANK
    public string Status { get; set; } = "PENDING";
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
