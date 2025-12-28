# Hướng Dẫn Tham Khảo Nhanh

Tham khảo nhanh cho các tác vụ và thông tin thường dùng.

## Cổng Dịch Vụ

| Dịch vụ        | Cổng  | Mục đích                    |
|----------------|-------|----------------------------|
| API Gateway    | 5000  | Điểm vào duy nhất           |
| Auth Service   | 5001  | Xác thực                    |
| NAPAS Service  | 5002  | Trung tâm định tuyến        |
| Bank A         | 5003  | Hoạt động Ngân hàng A       |
| Bank B         | 5004  | Hoạt động Ngân hàng B       |
| Bank C         | 5005  | Hoạt động Ngân hàng C       |
| RabbitMQ       | 5672  | AMQP message broker         |
| RabbitMQ UI    | 15672 | Console quản lý             |
| PostgreSQL     | 5432-5436 | Instances database      |

## Thông Tin Đăng Nhập Demo

| Người dùng    | Mật khẩu | Ngân hàng |
|---------------|----------|-----------|
| user_banka    | pass123  | BANKA     |
| user_bankb    | pass123  | BANKB     |
| user_bankc    | pass123  | BANKC     |
| admin         | admin123 | NAPAS     |

## Tài Khoản Demo

**Ngân hàng A:**
- BANKA001: John Doe ($100,000)
- BANKA002: Jane Smith ($50,000)
- BANKA003: Bob Johnson ($75,000)

**Ngân hàng B:**
- BANKB001: Alice Williams ($100,000)
- BANKB002: Charlie Brown ($50,000)
- BANKB003: Diana Prince ($75,000)

**Ngân hàng C:**
- BANKC001: Eve Anderson ($100,000)
- BANKC002: Frank Miller ($50,000)
- BANKC003: Grace Lee ($75,000)

## Lệnh Thường Dùng

### Khởi Động Hệ Thống
```bash
# Khởi động nhanh
./start.sh

# Khởi động thủ công
docker-compose up -d

# Với rebuild
docker-compose up --build -d

# Xem logs
docker-compose logs -f [tên-dịch-vụ]
```

### Dừng Hệ Thống
```bash
# Dừng tất cả
docker-compose down

# Dừng và xóa volumes (reset databases)
docker-compose down -v

# Dừng dịch vụ cụ thể
docker-compose stop banka-service
```

### Xem Logs
```bash
# Tất cả dịch vụ
docker-compose logs -f

# Dịch vụ cụ thể
docker-compose logs -f napas-service

# 100 dòng cuối
docker-compose logs --tail=100 banka-service
```

### Kiểm Tra Health
```bash
curl http://localhost:5001/health  # Auth
curl http://localhost:5002/health  # NAPAS
curl http://localhost:5003/health  # Bank A
curl http://localhost:5004/health  # Bank B
curl http://localhost:5005/health  # Bank C
curl http://localhost:5000/health  # Gateway
```

### Truy Cập Database
```bash
# Kết nối đến database Ngân hàng A
docker exec -it napas_postgres-banka_1 psql -U postgres -d bankadb

# Các truy vấn thường dùng
SELECT * FROM accounts;
SELECT * FROM transactions ORDER BY createdat DESC LIMIT 10;

# Kiểm tra số dư
SELECT accountnumber, accountholdername, balance FROM accounts;
```

### Quản Lý RabbitMQ
```bash
# Truy cập UI
open http://localhost:15672

# Đăng nhập: guest / guest

# Lệnh CLI (trong container)
docker exec napas_rabbitmq_1 rabbitmqctl list_queues
docker exec napas_rabbitmq_1 rabbitmqctl list_connections
```

## Tham Khảo API Nhanh

### Auth Service (5001)

```bash
# Đăng nhập
POST /api/auth/login
{
  "username": "user_banka",
  "password": "pass123"
}

# Danh sách người dùng
GET /api/auth/users
```

### Dịch vụ Ngân hàng (5003-5005)

```bash
# Lấy tài khoản
GET /api/accounts

# Lấy tài khoản cụ thể
GET /api/accounts/{accountNumber}

# Lấy giao dịch
GET /api/accounts/{accountNumber}/transactions

# Chuyển tiền nội bộ
POST /api/transfer/internal
{
  "fromAccountNumber": "BANKA001",
  "toAccountNumber": "BANKA002",
  "amount": 1000,
  "description": "Test"
}

# Chuyển tiền liên ngân hàng
POST /api/transfer/interbank
{
  "fromAccountNumber": "BANKA001",
  "toAccountNumber": "BANKB001",
  "toBankCode": "BANKB",
  "amount": 5000,
  "description": "Interbank test"
}
```

### Dịch vụ NAPAS (5002)

```bash
# Lấy giao dịch
GET /api/transactions

# Lấy giao dịch cụ thể
GET /api/transactions/{transactionId}

# Lấy đối soát
GET /api/reconciliation

# Lấy thống kê
GET /api/statistics
```

## Các Vấn Đề Thường Gặp

### Dịch vụ không khởi động
```bash
# Kiểm tra trạng thái
docker-compose ps

# Kiểm tra logs
docker-compose logs [tên-dịch-vụ]

# Khởi động lại
docker-compose restart [tên-dịch-vụ]
```

### Xung đột cổng
```bash
# Kiểm tra cái gì đang dùng cổng
lsof -i :5003  # Mac/Linux
netstat -ano | findstr :5003  # Windows

# Thay đổi cổng trong docker-compose.yml
```

### Vấn đề database
```bash
# Reset tất cả databases
docker-compose down -v
docker-compose up --build

# Kiểm tra kết nối database
docker exec -it [postgres-container] psql -U postgres -l
```

### RabbitMQ không kết nối
```bash
# Chờ 10-15 giây sau khi khởi động
# Kiểm tra RabbitMQ sẵn sàng
curl http://localhost:15672

# Khởi động lại RabbitMQ
docker-compose restart rabbitmq
```

### Lỗi CORS ở Frontend
```bash
# Đảm bảo dịch vụ đang chạy
curl http://localhost:5003/api/accounts

# Kiểm tra browser console để biết chi tiết
# Thử gọi API trực tiếp trước
```

## Shortcut Kiểm Thử

### Chuyển Tiền Nội Bộ Nhanh
```bash
curl -X POST http://localhost:5003/api/transfer/internal \
  -H "Content-Type: application/json" \
  -d '{"fromAccountNumber":"BANKA001","toAccountNumber":"BANKA002","amount":100,"description":"Quick test"}'
```

### Chuyển Tiền Liên Ngân Hàng Nhanh
```bash
curl -X POST http://localhost:5003/api/transfer/interbank \
  -H "Content-Type: application/json" \
  -d '{"fromAccountNumber":"BANKA001","toAccountNumber":"BANKB001","toBankCode":"BANKB","amount":500,"description":"Quick interbank"}'
```

### Kiểm Tra Thống Kê NAPAS
```bash
curl http://localhost:5002/api/statistics | jq
```

## Sơ Đồ Cấu Trúc Dự Án Nhanh

```
ms/
├── docker-compose.yml        # Cài đặt cơ sở hạ tầng
├── start.sh                  # Script khởi động nhanh
├── README.md                 # Tài liệu chính
├── src/
│   ├── AuthService/          # Xác thực JWT
│   ├── NapasService/         # Trung tâm hub
│   ├── BankA/                # Dịch vụ Ngân hàng A
│   ├── BankB/                # Dịch vụ Ngân hàng B
│   ├── BankC/                # Dịch vụ Ngân hàng C
│   ├── ApiGateway/           # Ocelot gateway
│   └── Shared/               # Code dùng chung
└── frontend/
    ├── bank-a/index.html     # UI Ngân hàng A
    ├── bank-b/index.html     # UI Ngân hàng B
    └── bank-c/index.html     # UI Ngân hàng C
```

## Mã Trạng Thái

- **PENDING**: Giao dịch đã gửi, đang chờ xử lý
- **SUCCESS**: Giao dịch hoàn thành thành công
- **FAILED**: Giao dịch thất bại (tài khoản không hợp lệ, v.v.)

## Hàng Đợi Tin Nhắn

- `transfer_napas`: Banks → NAPAS
- `transfer_banka`: NAPAS → Bank A
- `transfer_bankb`: NAPAS → Bank B
- `transfer_bankc`: NAPAS → Bank C
- `transfer_result`: Banks → NAPAS (kết quả)

## URLs Hữu Ích

- Bank A UI: `file:///home/ubuntu/ms/frontend/bank-a/index.html`
- Bank B UI: `file:///home/ubuntu/ms/frontend/bank-b/index.html`
- Bank C UI: `file:///home/ubuntu/ms/frontend/bank-c/index.html`
- RabbitMQ: http://localhost:15672

## Mẹo

1. **Luôn chờ 15-30 giây** sau khi khởi động dịch vụ
2. **Kiểm tra RabbitMQ trước** nếu chuyển tiền liên ngân hàng không hoạt động
3. **Dùng health endpoints** để xác minh dịch vụ đang chạy
4. **Kiểm tra logs** khi có lỗi
5. **Reset databases** với `docker-compose down -v` nếu dữ liệu bị hỏng
6. **Giám sát hàng đợi RabbitMQ** để xem luồng tin nhắn
7. **Dùng jq** để format JSON responses: `curl ... | jq`

## Các Bước Tiếp Theo

1. Đọc `README.md` cho tài liệu đầy đủ
2. Theo `TESTING.md` cho kiểm thử toàn diện
3. Xem `ARCHITECTURE.md` cho chi tiết kỹ thuật
4. Kiểm tra `PROJECT_SUMMARY.md` cho tổng quan

---

**Mẹo Pro**: Giữ file này mở khi làm việc với hệ thống!
