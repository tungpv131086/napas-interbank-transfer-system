namespace Shared.Models;

public class TransferMessage
{
    public string TransactionId { get; set; } = Guid.NewGuid().ToString();
    public string FromBankCode { get; set; } = string.Empty;
    public string ToBankCode { get; set; } = string.Empty;
    public string FromAccountNumber { get; set; } = string.Empty;
    public string ToAccountNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "PENDING"; // PENDING, SUCCESS, FAILED
    public string? ErrorMessage { get; set; }
}
