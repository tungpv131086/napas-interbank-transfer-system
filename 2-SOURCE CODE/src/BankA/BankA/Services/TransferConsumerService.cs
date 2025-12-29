using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using BankA.Data;
using BankA.Models;
using BankA.Hubs;
using Shared.Models;
using Shared.RabbitMQ;

namespace BankA.Services;

public class TransferConsumerService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TransferConsumerService> _logger;
    private readonly string _bankCode = "BANKA";
    private IConnection? _connection;
    private IModel? _channel;

    public TransferConsumerService(IServiceProvider serviceProvider, ILogger<TransferConsumerService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(10000, stoppingToken); // Wait for RabbitMQ to be ready

        try
        {
            var rabbitMqHost = Environment.GetEnvironmentVariable("RabbitMQ__Host") ?? "rabbitmq";
            var helper = new RabbitMqHelper(rabbitMqHost);
            _connection = helper.CreateConnection();
            _channel = _connection.CreateModel();

            var queueName = $"transfer_{_bankCode.ToLower()}";
            _channel.QueueDeclare(queue: queueName, durable: true, exclusive: false, autoDelete: false, arguments: null);

            var consumer = new EventingBasicConsumer(_channel);
            consumer.Received += async (model, ea) =>
            {
                var body = ea.Body.ToArray();
                var transferMessage = RabbitMqHelper.DeserializeMessage<TransferMessage>(body);

                if (transferMessage != null)
                {
                    _logger.LogInformation($"Received transfer: {transferMessage.TransactionId}");
                    await ProcessTransfer(transferMessage);
                }

                _channel.BasicAck(deliveryTag: ea.DeliveryTag, multiple: false);
            };

            _channel.BasicConsume(queue: queueName, autoAck: false, consumer: consumer);
            _logger.LogInformation($"Started consuming messages from {queueName}");

            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in TransferConsumerService");
        }
    }

    private async Task ProcessTransfer(TransferMessage transfer)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<BankDbContext>();
        var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<BalanceHub>>();

        try
        {
            // Check if this is a completion notification for an outgoing transfer
            if (transfer.FromBankCode == _bankCode && transfer.ToBankCode != _bankCode)
            {
                _logger.LogInformation($"Received completion notification for outgoing transfer {transfer.TransactionId} with status {transfer.Status}");
                await ProcessCompletionNotification(transfer, dbContext, hubContext);
                return;
            }

            // This is an incoming transfer (Bank A is recipient)
            var account = await dbContext.Accounts.FirstOrDefaultAsync(a => a.AccountNumber == transfer.ToAccountNumber);

            if (account == null)
            {
                _logger.LogWarning($"Account {transfer.ToAccountNumber} not found");
                transfer.Status = TransferStatus.Failed;
                transfer.ErrorMessage = "Destination account not found";
                await SendResultToNapas(transfer);
                return;
            }

            account.Balance += transfer.Amount;

            var transaction = new Transaction
            {
                TransactionId = transfer.TransactionId,
                FromAccountNumber = transfer.FromAccountNumber,
                ToAccountNumber = transfer.ToAccountNumber,
                ToBankCode = _bankCode,
                Amount = transfer.Amount,
                Description = transfer.Description,
                Type = "INTERBANK",
                Status = TransferStatus.Success,
                CreatedAt = transfer.Timestamp,
                CompletedAt = DateTime.UtcNow
            };

            dbContext.Transactions.Add(transaction);
            await dbContext.SaveChangesAsync();

            // Broadcast real-time balance update to receiver
            await hubContext.Clients.Group(account.AccountNumber).SendAsync("BalanceUpdated", new
            {
                accountNumber = account.AccountNumber,
                balance = account.Balance,
                transactionId = transfer.TransactionId
            });

            // Broadcast new transaction notification
            await hubContext.Clients.Group(account.AccountNumber).SendAsync("TransactionReceived", new
            {
                transactionId = transfer.TransactionId,
                fromBank = transfer.FromBankCode,
                fromAccount = transfer.FromAccountNumber,
                amount = transfer.Amount,
                description = transfer.Description
            });

            transfer.Status = TransferStatus.Success;
            _logger.LogInformation($"Transfer {transfer.TransactionId} completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error processing transfer {transfer.TransactionId}");
            transfer.Status = TransferStatus.Failed;
            transfer.ErrorMessage = ex.Message;
        }

        await SendResultToNapas(transfer);
    }

    private async Task ProcessCompletionNotification(TransferMessage transfer, BankDbContext dbContext, IHubContext<BalanceHub> hubContext)
    {
        try
        {
            // Find the existing outgoing transaction
            var transaction = await dbContext.Transactions
                .FirstOrDefaultAsync(t => t.TransactionId == transfer.TransactionId);

            if (transaction != null)
            {
                // Update transaction status
                transaction.Status = transfer.Status;
                transaction.CompletedAt = DateTime.UtcNow;
                if (!string.IsNullOrEmpty(transfer.ErrorMessage))
                {
                    transaction.ErrorMessage = transfer.ErrorMessage;
                }

                await dbContext.SaveChangesAsync();

                // Notify sender via SignalR
                await hubContext.Clients.Group(transfer.FromAccountNumber).SendAsync("TransactionCompleted", new
                {
                    transactionId = transfer.TransactionId,
                    status = transfer.Status,
                    errorMessage = transfer.ErrorMessage
                });

                _logger.LogInformation($"Updated outgoing transfer {transfer.TransactionId} to status {transfer.Status}");
            }
            else
            {
                _logger.LogWarning($"Outgoing transaction {transfer.TransactionId} not found in database");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error processing completion notification for {transfer.TransactionId}");
        }
    }

    private async Task SendResultToNapas(TransferMessage transfer)
    {
        try
        {
            if (_channel != null)
            {
                var helper = new RabbitMqHelper("rabbitmq");
                helper.PublishMessage(_channel, "transfer_result", transfer);
                _logger.LogInformation($"Sent result for {transfer.TransactionId} to NAPAS");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending result to NAPAS");
        }

        await Task.CompletedTask;
    }

    public override void Dispose()
    {
        _channel?.Close();
        _connection?.Close();
        base.Dispose();
    }
}
