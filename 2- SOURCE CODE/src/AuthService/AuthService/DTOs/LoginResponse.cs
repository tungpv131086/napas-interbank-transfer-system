namespace AuthService.DTOs;

public record LoginResponse(string Token, string BankCode, string Username, string Role);
