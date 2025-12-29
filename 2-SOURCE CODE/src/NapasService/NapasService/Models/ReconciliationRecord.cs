namespace NapasService.Models;

public class ReconciliationRecord
{
    public int Id { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public string FromBankCode { get; set; } = string.Empty;
    public string ToBankCode { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime TransactionDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}
