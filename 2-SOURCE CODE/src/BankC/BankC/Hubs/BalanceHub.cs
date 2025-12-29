using Microsoft.AspNetCore.SignalR;

namespace BankC.Hubs;

public class BalanceHub : Hub
{
    public async Task SubscribeToAccount(string accountNumber)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, accountNumber);
    }

    public async Task UnsubscribeFromAccount(string accountNumber)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, accountNumber);
    }
}
