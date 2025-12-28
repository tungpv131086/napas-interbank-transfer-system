namespace NapasService.Models;

public class NapasTransaction
{
    public int Id { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public string FromBankCode { get; set; } = string.Empty;
    public string ToBankCode { get; set; } = string.Empty;
    public string FromAccountNumber { get; set; } = string.Empty;
    public string ToAccountNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "PENDING";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }
}
