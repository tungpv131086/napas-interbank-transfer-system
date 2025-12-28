using Microsoft.EntityFrameworkCore;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using NapasService.Data;
using NapasService.Models;
using Shared.Models;
using Shared.RabbitMQ;

namespace NapasService.Services;

public class ResultProcessorService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ResultProcessorService> _logger;
    private IConnection? _connection;
    private IModel? _channel;

    public ResultProcessorService(IServiceProvider serviceProvider, ILogger<ResultProcessorService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(10000, stoppingToken);

        try
        {
            var rabbitMqHost = Environment.GetEnvironmentVariable("RabbitMQ__Host") ?? "rabbitmq";
            var helper = new RabbitMqHelper(rabbitMqHost);
            _connection = helper.CreateConnection();
            _channel = _connection.CreateModel();

            var queueName = "transfer_result";
            _channel.QueueDeclare(queue: queueName, durable: true, exclusive: false, autoDelete: false, arguments: null);

            var consumer = new EventingBasicConsumer(_channel);
            consumer.Received += async (model, ea) =>
            {
                var body = ea.Body.ToArray();
                var result = RabbitMqHelper.DeserializeMessage<TransferMessage>(body);

                if (result != null)
                {
                    _logger.LogInformation($"NAPAS received result for: {result.TransactionId} - Status: {result.Status}");
                    await ProcessResult(result);
                }

                _channel.BasicAck(deliveryTag: ea.DeliveryTag, multiple: false);
            };

            _channel.BasicConsume(queue: queueName, autoAck: false, consumer: consumer);
            _logger.LogInformation("NAPAS ResultProcessorService started");

            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ResultProcessorService");
        }
    }

    private async Task ProcessResult(TransferMessage result)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<NapasDbContext>();

        try
        {
            var transaction = await dbContext.Transactions
                .FirstOrDefaultAsync(t => t.TransactionId == result.TransactionId);

            if (transaction != null)
            {
                transaction.Status = result.Status;
                transaction.CompletedAt = DateTime.UtcNow;
                transaction.ErrorMessage = result.ErrorMessage;

                // Create reconciliation record
                var reconciliation = new ReconciliationRecord
                {
                    TransactionId = result.TransactionId,
                    FromBankCode = result.FromBankCode,
                    ToBankCode = result.ToBankCode,
                    Amount = result.Amount,
                    TransactionDate = result.Timestamp,
                    Status = result.Status
                };

                dbContext.ReconciliationRecords.Add(reconciliation);
                await dbContext.SaveChangesAsync();

                _logger.LogInformation($"Updated transaction {result.TransactionId} to {result.Status}");

                // Notify source bank about transfer completion
                if (_channel != null && !string.IsNullOrEmpty(result.FromBankCode))
                {
                    var sourceQueue = $"transfer_{result.FromBankCode.ToLower()}";
                    var helper = new RabbitMqHelper("rabbitmq");

                    var completionMessage = new TransferMessage
                    {
                        TransactionId = result.TransactionId,
                        FromBankCode = result.FromBankCode,
                        ToBankCode = result.ToBankCode,
                        FromAccountNumber = result.FromAccountNumber,
                        ToAccountNumber = result.ToAccountNumber,
                        Amount = result.Amount,
                        Description = result.Description,
                        Status = result.Status,
                        ErrorMessage = result.ErrorMessage,
                        Timestamp = DateTime.UtcNow
                    };

                    helper.PublishMessage(_channel, sourceQueue, completionMessage);
                    _logger.LogInformation($"Notified {result.FromBankCode} about completion of {result.TransactionId} with status {result.Status}");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error processing result for {result.TransactionId}");
        }
    }

    public override void Dispose()
    {
        _channel?.Close();
        _connection?.Close();
        base.Dispose();
    }
}
