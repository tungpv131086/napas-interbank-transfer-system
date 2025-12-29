using Microsoft.EntityFrameworkCore;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using NapasService.Data;
using NapasService.Models;
using Shared.Models;
using Shared.RabbitMQ;

namespace NapasService.Services;

public class TransferRouterService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TransferRouterService> _logger;
    private IConnection? _connection;
    private IModel? _channel;

    public TransferRouterService(IServiceProvider serviceProvider, ILogger<TransferRouterService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(10000, stoppingToken); // Wait for RabbitMQ

        try
        {
            var rabbitMqHost = Environment.GetEnvironmentVariable("RabbitMQ__Host") ?? "rabbitmq";
            var helper = new RabbitMqHelper(rabbitMqHost);
            _connection = helper.CreateConnection();
            _channel = _connection.CreateModel();

            var queueName = "transfer_napas";
            _channel.QueueDeclare(queue: queueName, durable: true, exclusive: false, autoDelete: false, arguments: null);

            var consumer = new EventingBasicConsumer(_channel);
            consumer.Received += async (model, ea) =>
            {
                var body = ea.Body.ToArray();
                var transferMessage = RabbitMqHelper.DeserializeMessage<TransferMessage>(body);

                if (transferMessage != null)
                {
                    _logger.LogInformation($"NAPAS received transfer: {transferMessage.TransactionId} from {transferMessage.FromBankCode} to {transferMessage.ToBankCode}");
                    await RouteTransfer(transferMessage);
                }

                _channel.BasicAck(deliveryTag: ea.DeliveryTag, multiple: false);
            };

            _channel.BasicConsume(queue: queueName, autoAck: false, consumer: consumer);
            _logger.LogInformation("NAPAS TransferRouterService started");

            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in TransferRouterService");
        }
    }

    private async Task RouteTransfer(TransferMessage transfer)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<NapasDbContext>();

        try
        {
            // Record transaction in NAPAS
            var napasTransaction = new NapasTransaction
            {
                TransactionId = transfer.TransactionId,
                FromBankCode = transfer.FromBankCode,
                ToBankCode = transfer.ToBankCode,
                FromAccountNumber = transfer.FromAccountNumber,
                ToAccountNumber = transfer.ToAccountNumber,
                Amount = transfer.Amount,
                Description = transfer.Description,
                Status = TransferStatus.Pending,
                CreatedAt = transfer.Timestamp
            };

            dbContext.Transactions.Add(napasTransaction);
            await dbContext.SaveChangesAsync();

            // Route to destination bank
            if (_channel != null)
            {
                var targetQueue = $"transfer_{transfer.ToBankCode.ToLower()}";
                var helper = new RabbitMqHelper("rabbitmq");
                helper.PublishMessage(_channel, targetQueue, transfer);
                _logger.LogInformation($"Routed transfer {transfer.TransactionId} to {targetQueue}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error routing transfer {transfer.TransactionId}");
        }
    }

    public override void Dispose()
    {
        _channel?.Close();
        _connection?.Close();
        base.Dispose();
    }
}
