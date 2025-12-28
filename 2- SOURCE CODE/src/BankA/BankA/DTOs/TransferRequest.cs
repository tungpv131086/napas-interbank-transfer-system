namespace BankA.DTOs;

public record TransferRequest(
    string FromAccountNumber,
    string ToAccountNumber,
    string? ToBankCode,
    decimal Amount,
    string Description
);
