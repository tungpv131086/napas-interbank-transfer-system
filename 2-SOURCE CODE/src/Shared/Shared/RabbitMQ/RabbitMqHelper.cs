using RabbitMQ.Client;
using System.Text;
using System.Text.Json;

namespace Shared.RabbitMQ;

public class RabbitMqHelper
{
    private readonly string _hostname;
    private readonly string _username;
    private readonly string _password;

    public RabbitMqHelper(string hostname, string username = "guest", string password = "guest")
    {
        _hostname = hostname;
        _username = username;
        _password = password;
    }

    public IConnection CreateConnection()
    {
        var factory = new ConnectionFactory
        {
            HostName = _hostname,
            UserName = _username,
            Password = _password,
            AutomaticRecoveryEnabled = true,
            NetworkRecoveryInterval = TimeSpan.FromSeconds(10)
        };

        return factory.CreateConnection();
    }

    public void PublishMessage<T>(IModel channel, string queueName, T message)
    {
        channel.QueueDeclare(queue: queueName, durable: true, exclusive: false, autoDelete: false, arguments: null);

        var json = JsonSerializer.Serialize(message);
        var body = Encoding.UTF8.GetBytes(json);

        var properties = channel.CreateBasicProperties();
        properties.Persistent = true;

        channel.BasicPublish(exchange: "", routingKey: queueName, basicProperties: properties, body: body);
    }

    public static T? DeserializeMessage<T>(byte[] body)
    {
        var json = Encoding.UTF8.GetString(body);
        return JsonSerializer.Deserialize<T>(json);
    }
}
