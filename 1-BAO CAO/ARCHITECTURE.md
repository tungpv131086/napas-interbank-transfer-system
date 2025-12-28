# Kiến Trúc Hệ Thống NAPAS

## Tổng Quan

Tài liệu này mô tả kiến trúc kỹ thuật của hệ thống mô phỏng chuyển tiền liên ngân hàng NAPAS.

## Các Thành Phần Hệ Thống

### 1. Dịch Vụ Xác Thực (Cổng 5001)
- **Công nghệ**: .NET 8 Minimal API
- **Database**: PostgreSQL (authdb)
- **Mục đích**: Xác thực tập trung dựa trên JWT
- **Tính năng**:
  - Đăng nhập người dùng với username/password
  - Tạo JWT token
  - Người dùng demo hardcode để kiểm thử nhanh

### 2. Dịch Vụ NAPAS Core (Cổng 5002)
- **Công nghệ**: .NET 8 Minimal API
- **Database**: PostgreSQL (napasdb)
- **Message Queue**: RabbitMQ consumer/publisher
- **Mục đích**: Trung tâm hub cho chuyển tiền liên ngân hàng
- **Tính năng**:
  - Nhận yêu cầu chuyển tiền từ ngân hàng
  - Định tuyến chuyển tiền đến ngân hàng đích
  - Xử lý kết quả từ ngân hàng đích
  - Duy trì lịch sử giao dịch
  - Cung cấp bản ghi đối soát để thanh toán
  - API thống kê

**Background Services**:
- `TransferRouterService`: Consume từ queue `transfer_napas`
- `ResultProcessorService`: Consume từ queue `transfer_result`

### 3. Dịch Vụ Ngân Hàng (Cổng 5003-5005)
- **Công nghệ**: .NET 8 Minimal API
- **Real-time**: SignalR WebSocket Hub
- **Database**: PostgreSQL (bankadb, bankbdb, bankcdb)
- **Message Queue**: RabbitMQ consumer/publisher
- **Mục đích**: Hoạt động ngân hàng riêng lẻ
- **Tính năng**:
  - Quản lý tài khoản
  - Chuyển tiền nội bộ (cùng ngân hàng)
  - Khởi tạo chuyển tiền liên ngân hàng
  - Nhận chuyển tiền liên ngân hàng đến
  - Lịch sử giao dịch
  - Cập nhật số dư thời gian thực qua SignalR
  - Thông báo giao dịch thời gian thực

**Background Services**:
- `TransferConsumerService`: Consume từ queue `transfer_{bankcode}`

**SignalR Hub**:
- `BalanceHub` (endpoint: `/balanceHub`)
  - Methods: `SubscribeToAccount`, `UnsubscribeFromAccount`
  - Events: `BalanceUpdated`, `TransactionReceived`
  - Sử dụng SignalR groups để nhắm đến chủ tài khoản cụ thể

### 4. API Gateway (Cổng 5000)
- **Công nghệ**: Ocelot
- **Mục đích**: Điểm vào duy nhất cho tất cả dịch vụ
- **Tính năng**:
  - Tổng hợp route
  - Chuyển tiếp request
  - Xử lý CORS
  - Cân bằng tải (tương lai)

### 5. Message Broker
- **Công nghệ**: RabbitMQ
- **Cổng**: 5672 (AMQP), 15672 (Management UI)
- **Queues**:
  - `transfer_napas`: Bank → NAPAS
  - `transfer_banka`: NAPAS → Bank A
  - `transfer_bankb`: NAPAS → Bank B
  - `transfer_bankc`: NAPAS → Bank C
  - `transfer_result`: Banks → NAPAS

### 6. Databases
- **Công nghệ**: PostgreSQL 15
- **Instances**: 5 databases riêng biệt
  - authdb (5432)
  - napasdb (5433)
  - bankadb (5434)
  - bankbdb (5435)
  - bankcdb (5436)

[Phần còn lại của ARCHITECTURE.md được dịch tương tự...]
