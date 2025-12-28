# KIẾN TRÚC HỆ THỐNG NAPAS

## Tổng quan

Tài liệu này mô tả kiến trúc kỹ thuật của hệ thống mô phỏng chuyển tiền liên ngân hàng NAPAS.

## Các Thành phần Hệ thống

### 1. Dịch vụ Xác thực (Port 5001)
- **Công nghệ**: .NET 8 Minimal API
- **Cơ sở dữ liệu**: PostgreSQL (authdb)
- **Mục đích**: Xác thực tập trung dựa trên JWT
- **Tính năng**:
  - Đăng nhập người dùng với username/password
  - Tạo JWT token
  - Người dùng demo được hardcode để test nhanh

### 2. Dịch vụ NAPAS Core (Port 5002)
- **Công nghệ**: .NET 8 Minimal API
- **Cơ sở dữ liệu**: PostgreSQL (napasdb)
- **Message Queue**: RabbitMQ consumer/publisher
- **Mục đích**: Trung tâm điều phối cho chuyển tiền liên ngân hàng
- **Tính năng**:
  - Nhận yêu cầu chuyển tiền từ các ngân hàng
  - Định tuyến chuyển tiền đến ngân hàng đích
  - Xử lý kết quả từ ngân hàng đích
  - Lưu trữ lịch sử giao dịch
  - Cung cấp bản ghi đối soát để thanh toán
  - Cung cấp API thống kê

**Background Services**:
- `TransferRouterService`: Consume từ queue `transfer_napas`
- `ResultProcessorService`: Consume từ queue `transfer_result`

### 3. Dịch vụ Ngân hàng (Ports 5003-5005)
- **Công nghệ**: .NET 8 Minimal API
- **Real-time**: SignalR WebSocket Hub
- **Cơ sở dữ liệu**: PostgreSQL (bankadb, bankbdb, bankcdb)
- **Message Queue**: RabbitMQ consumer/publisher
- **Mục đích**: Các hoạt động của từng ngân hàng riêng biệt
- **Tính năng**:
  - Quản lý tài khoản
  - Chuyển tiền nội bộ (cùng ngân hàng)
  - Khởi tạo chuyển tiền liên ngân hàng
  - Nhận chuyển tiền liên ngân hàng đến
  - Lịch sử giao dịch
  - Cập nhật số dư real-time qua SignalR
  - Thông báo giao dịch real-time

**Background Services**:
- `TransferConsumerService`: Consume từ queue `transfer_{bankcode}`

**SignalR Hub**:
- `BalanceHub` (endpoint: `/balanceHub`)
  - Methods: `SubscribeToAccount`, `UnsubscribeFromAccount`
  - Events: `BalanceUpdated`, `TransactionReceived`
  - Sử dụng SignalR groups để nhắm đến chủ tài khoản cụ thể

### 4. API Gateway (Port 5000)
- **Công nghệ**: Ocelot
- **Mục đích**: Điểm vào duy nhất cho tất cả services
- **Tính năng**:
  - Route aggregation
  - Request forwarding
  - Xử lý CORS
  - Load balancing (tương lai)

### 5. Message Broker
- **Công nghệ**: RabbitMQ
- **Ports**: 5672 (AMQP), 15672 (Management UI)
- **Queues**:
  - `transfer_napas`: Bank → NAPAS
  - `transfer_banka`: NAPAS → Bank A
  - `transfer_bankb`: NAPAS → Bank B
  - `transfer_bankc`: NAPAS → Bank C
  - `transfer_result`: Banks → NAPAS

### 6. Cơ sở dữ liệu
- **Công nghệ**: PostgreSQL 15
- **Instances**: 5 databases riêng biệt
  - authdb (5432)
  - napasdb (5433)
  - bankadb (5434)
  - bankbdb (5435)
  - bankcdb (5436)

## Luồng Dữ liệu

### Luồng Chuyển Tiền Nội Bộ
```
┌─────────────────────────────────────────────┐
│ Người dùng khởi tạo chuyển tiền nội bộ     │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ Bank Service kiểm tra:                      │
│ - Tài khoản tồn tại                         │
│ - Số dư đủ                                  │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ Cập nhật số dư trong một transaction:      │
│ - Trừ từ người gửi                          │
│ - Cộng cho người nhận                       │
│ - Lưu bản ghi giao dịch (SUCCESS)           │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ SignalR broadcast cập nhật real-time:      │
│ - Gửi BalanceUpdated đến nhóm người gửi    │
│ - Gửi BalanceUpdated đến nhóm người nhận   │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ Trả về response thành công ngay lập tức     │
└─────────────────────────────────────────────┘
```

### Luồng Chuyển Tiền Liên Ngân Hàng
```
┌─────────────────────────────────────────────┐
│ Người dùng khởi tạo chuyển tiền liên NH    │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ Ngân hàng nguồn kiểm tra và trừ tiền:      │
│ - Tài khoản tồn tại                         │
│ - Số dư đủ                                  │
│ - Trừ từ người gửi                          │
│ - Lưu giao dịch (PENDING)                   │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ SignalR broadcast đến người gửi:           │
│ - Gửi BalanceUpdated đến nhóm người gửi    │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ Publish lên RabbitMQ:                       │
│ Queue: transfer_napas                       │
│ Message: TransferMessage                    │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ NAPAS nhận và xử lý:                       │
│ - Ghi log giao dịch                         │
│ - Kiểm tra ngân hàng đích                   │
│ - Định tuyến đến đích                       │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ Publish đến ngân hàng đích:                │
│ Queue: transfer_{destination_bank}          │
│ Message: TransferMessage                    │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ Ngân hàng đích xử lý:                      │
│ - Kiểm tra tài khoản tồn tại                │
│ - Cộng tiền cho người nhận                  │
│ - Lưu giao dịch                             │
│ - Đặt trạng thái (SUCCESS/FAILED)           │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ SignalR broadcast đến người nhận:          │
│ - Gửi BalanceUpdated đến nhóm người nhận   │
│ - Gửi thông báo TransactionReceived        │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ Publish kết quả về NAPAS:                  │
│ Queue: transfer_result                      │
│ Message: TransferMessage (kèm status)       │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│ NAPAS cập nhật bản ghi:                    │
│ - Cập nhật trạng thái giao dịch             │
│ - Tạo bản ghi đối soát                      │
│ - Hoàn tất giao dịch                        │
└─────────────────────────────────────────────┘
```

## Database Schema

### Auth Service

```sql
CREATE TABLE Users (
    Id SERIAL PRIMARY KEY,
    Username VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(100) NOT NULL,
    BankCode VARCHAR(10) NOT NULL,
    Role VARCHAR(50) NOT NULL
);
```

### Bank Services

```sql
CREATE TABLE Accounts (
    Id SERIAL PRIMARY KEY,
    AccountNumber VARCHAR(50) NOT NULL UNIQUE,
    AccountHolderName VARCHAR(200) NOT NULL,
    Balance DECIMAL(18,2) NOT NULL,
    CreatedAt TIMESTAMP NOT NULL
);

CREATE TABLE Transactions (
    Id SERIAL PRIMARY KEY,
    TransactionId VARCHAR(100) NOT NULL UNIQUE,
    FromAccountNumber VARCHAR(50) NOT NULL,
    ToAccountNumber VARCHAR(50) NOT NULL,
    ToBankCode VARCHAR(10),
    Amount DECIMAL(18,2) NOT NULL,
    Description TEXT,
    Type VARCHAR(20) NOT NULL, -- INTERNAL, INTERBANK
    Status VARCHAR(20) NOT NULL, -- PENDING, SUCCESS, FAILED
    CreatedAt TIMESTAMP NOT NULL,
    CompletedAt TIMESTAMP
);
```

### NAPAS Service

```sql
CREATE TABLE NapasTransactions (
    Id SERIAL PRIMARY KEY,
    TransactionId VARCHAR(100) NOT NULL UNIQUE,
    FromBankCode VARCHAR(10) NOT NULL,
    ToBankCode VARCHAR(10) NOT NULL,
    FromAccountNumber VARCHAR(50) NOT NULL,
    ToAccountNumber VARCHAR(50) NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    Description TEXT,
    Status VARCHAR(20) NOT NULL,
    CreatedAt TIMESTAMP NOT NULL,
    CompletedAt TIMESTAMP,
    ErrorMessage TEXT
);

CREATE TABLE ReconciliationRecords (
    Id SERIAL PRIMARY KEY,
    TransactionId VARCHAR(100) NOT NULL,
    FromBankCode VARCHAR(10) NOT NULL,
    ToBankCode VARCHAR(10) NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    TransactionDate TIMESTAMP NOT NULL,
    Status VARCHAR(20) NOT NULL,
    RecordedAt TIMESTAMP NOT NULL
);
```

## Định dạng Message

### TransferMessage
```json
{
  "transactionId": "guid",
  "fromBankCode": "BANKA",
  "toBankCode": "BANKB",
  "fromAccountNumber": "BANKA001",
  "toAccountNumber": "BANKB001",
  "amount": 5000.00,
  "description": "Mô tả chuyển tiền",
  "timestamp": "2024-01-01T12:00:00Z",
  "status": "PENDING",
  "errorMessage": null
}
```

## Các Cân nhắc về Bảo mật

### Triển khai Hiện tại (Demo)
- Thông tin đăng nhập được hardcode
- JWT đơn giản không có refresh token
- Không hash password
- CORS policy mở
- Chỉ HTTP (không có HTTPS)

### Yêu cầu cho Production
- Hash password bằng BCrypt
- Rotation refresh token
- Kiểm soát truy cập dựa trên vai trò (RBAC)
- Giới hạn tốc độ API (rate limiting)
- Validation và sanitization input
- HTTPS/TLS ở mọi nơi
- Mã hóa database
- Quản lý secrets (Azure Key Vault, AWS Secrets Manager)
- Audit logging

## Các Pattern về Khả năng Mở rộng

### Thiết kế Hiện tại
- Single instance cho mỗi service
- Single database cho mỗi service
- RabbitMQ queues đơn giản

### Quy mô Production
- **Horizontal Scaling**: Nhiều instances sau load balancer
- **Database**: Read replicas, connection pooling
- **Caching**: Redis cho dữ liệu truy cập thường xuyên
- **Message Queue**: RabbitMQ clustering
- **CDN**: Phân phối nội dung tĩnh
- **Auto-scaling**: Kubernetes HPA

## Monitoring & Observability

### Stack Khuyến nghị
- **Logging**: Serilog → Elasticsearch → Kibana (ELK)
- **Metrics**: Prometheus → Grafana
- **Tracing**: OpenTelemetry → Jaeger
- **APM**: Application Insights / New Relic
- **Alerting**: PagerDuty / Opsgenie

### Các Metrics Quan trọng cần Monitor
- Tỷ lệ thành công của giao dịch
- Thời gian giao dịch trung bình
- Độ sâu queue (RabbitMQ)
- Database connections
- Thời gian phản hồi API
- Tỷ lệ lỗi
- Sử dụng tài nguyên hệ thống (CPU, Memory, Disk)

## Khôi phục Thảm họa

### Chiến lược Backup
- **Databases**: Backup tự động hàng ngày
- **Message Queue**: Durable queues, persistent messages
- **Configuration**: Version controlled
- **Secrets**: Backup được mã hóa

### Kế hoạch Khôi phục
1. Restore databases từ backup
2. Replay các message thất bại từ dead letter queue
3. Kiểm tra tính nhất quán dữ liệu
4. Chạy báo cáo đối soát

## Tối ưu Hiệu năng

### Database
- Thêm indexes trên các cột truy vấn thường xuyên
- Sử dụng connection pooling
- Triển khai read replicas
- Phân vùng (partition) các bảng lớn

### Message Queue
- Sử dụng message batching
- Triển khai prefetch limits
- Monitor độ sâu queue
- Sử dụng priority queues cho chuyển tiền khẩn cấp

### API
- Triển khai response caching
- Sử dụng async/await đúng cách
- Thêm compression
- Tối ưu độ phức tạp query

## Chiến lược Testing

### Unit Tests
- Business logic
- Validation rules
- Helper functions

### Integration Tests
- Database operations
- Message queue publishing/consuming
- External API calls

### End-to-End Tests
- Luồng chuyển tiền hoàn chỉnh
- UI interactions
- Các tình huống lỗi

### Load Tests
- Chuyển tiền đồng thời
- Mô phỏng tải cao điểm
- Stress testing

## Deployment

### Development
```bash
docker-compose up --build
```

### Staging/Production
- Sử dụng Kubernetes manifests
- Triển khai blue-green deployment
- Cấu hình auto-scaling
- Thiết lập load balancers
- Sử dụng managed databases (RDS, Azure SQL)
- Cấu hình monitoring và alerts

## Cải tiến Tương lai

1. **Chuyển tiền Định kỳ**: Thanh toán lặp lại dựa trên Cron
2. **Đa Tiền tệ**: Hỗ trợ VND, USD, EUR
3. **Giới hạn Giao dịch**: Hạn mức theo ngày/tháng
4. **Phát hiện Gian lận**: Phát hiện bất thường dựa trên ML
5. **Ứng dụng Mobile**: React Native/Flutter
6. **Thông báo Real-time**: WebSocket/SignalR
7. **Báo cáo Nâng cao**: Dashboard phân tích
8. **Xử lý Batch**: Thanh toán cuối ngày
9. **API Versioning**: Hỗ trợ nhiều phiên bản API
10. **GraphQL**: Thay thế cho REST APIs
