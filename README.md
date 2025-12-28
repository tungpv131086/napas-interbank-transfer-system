# Hệ Thống Chuyển Tiền Liên Ngân Hàng Nhanh 24/7 - Mô Phỏng NAPAS

Một hệ thống mô phỏng hoàn chỉnh dựa trên kiến trúc microservices cho hệ thống chuyển tiền liên ngân hàng NAPAS (Tổng Công ty Thanh toán Quốc gia Việt Nam) được xây dựng với .NET 8, PostgreSQL và RabbitMQ.

## Kiến Trúc Hệ Thống

```
┌─────────────────┐
│   API Gateway   │ :5000 (Ocelot)
│    (Định tuyến)  │
└────────┬────────┘
         │
    ┌────┴────┬─────────┬─────────┬──────────┐
    │         │         │         │          │
┌───▼──┐  ┌──▼──┐  ┌──▼──┐  ┌───▼───┐  ┌──▼───┐
│ Auth │  │Ngân │  │Ngân │  │Ngân   │  │NAPAS │
│:5001 │  │Hàng │  │Hàng │  │Hàng C │  │:5002 │
└──────┘  │A    │  │B    │  │:5005  │  └──┬───┘
          │:5003│  │:5004│  └───────┘     │
          └─────┘  └─────┘                │
              │         │                  │
              └─────────┴──────────────────┘
                         │
                    ┌────▼────┐
                    │RabbitMQ │ :5672, :15672
                    └─────────┘
```

## Tính Năng

### Đã Triển Khai
- **Dịch vụ Xác thực**: Xác thực dựa trên JWT với người dùng demo hardcode
- **3 Ngân hàng Mô phỏng**: Ngân hàng A, B, C với cơ sở dữ liệu riêng biệt
- **Dịch vụ NAPAS Core**: Trung tâm định tuyến cho chuyển tiền liên ngân hàng
- **Chuyển tiền Nội bộ**: Chuyển tiền tức thì trong cùng ngân hàng
- **Chuyển tiền Liên ngân hàng 24/7**: Qua NAPAS với định tuyến tin nhắn thời gian thực
- **Trạng thái Giao dịch**: PENDING → SUCCESS / FAILED
- **Lịch sử Giao dịch**: Xem tất cả giao dịch với bộ lọc
- **Đối soát**: NAPAS lưu trữ bản ghi để thanh toán
- **Giao diện Web Đơn giản**: Giao diện dựa trên Bootstrap cho mỗi ngân hàng
- **Cập nhật Thời gian thực**: SignalR để cập nhật số dư trực tiếp và thông báo giao dịch
- **Thông báo Toast**: Thông báo thân thiện với người dùng cho mọi hoạt động tài khoản
- **Trạng thái Kết nối**: Chỉ báo trực quan cho tình trạng kết nối thời gian thực
- **API Gateway**: Ocelot để định tuyến và chuyển tiếp đơn giản
- **Hàng đợi Tin nhắn**: RabbitMQ cho giao tiếp bất đồng bộ
- **Database per Service**: PostgreSQL cho mỗi microservice
- **Docker hóa**: Cài đặt Docker Compose hoàn chỉnh

## Công Nghệ Sử Dụng

- **Backend**: .NET 8 (Minimal APIs)
- **Giao tiếp Thời gian thực**: SignalR (WebSockets)
- **ORM**: Entity Framework Core
- **Cơ sở dữ liệu**: PostgreSQL 15
- **Message Broker**: RabbitMQ
- **API Gateway**: Ocelot
- **Frontend**: HTML + Bootstrap 5 + Vanilla JavaScript + SignalR Client
- **Container**: Docker + Docker Compose

## Cấu Trúc Dự Án

```
napas-simulation/
├── src/
│   ├── AuthService/       # Dịch vụ xác thực JWT
│   ├── NapasService/      # Dịch vụ định tuyến NAPAS trung tâm
│   ├── BankA/             # Microservice Ngân hàng A
│   ├── BankB/             # Microservice Ngân hàng B
│   ├── BankC/             # Microservice Ngân hàng C
│   ├── ApiGateway/        # API Gateway Ocelot
│   └── Shared/            # Các model và helper dùng chung
├── frontend/
│   ├── multi-bank-dashboard/  # Dashboard thống nhất (nginx-served)
│   ├── bank-a/                # Giao diện web Ngân hàng A
│   ├── bank-b/                # Giao diện web Ngân hàng B
│   └── bank-c/                # Giao diện web Ngân hàng C
├── docker-compose.yml    # Cài đặt cơ sở hạ tầng hoàn chỉnh
└── README.md
```

## Sơ Đồ Cơ Sở Dữ Liệu

### Dịch vụ Ngân hàng (BankA/B/C)
- **Accounts**: AccountNumber, AccountHolderName, Balance, CreatedAt
- **Transactions**: TransactionId, FromAccountNumber, ToAccountNumber, ToBankCode, Amount, Description, Type, Status, ErrorMessage, CreatedAt, CompletedAt

### Dịch vụ NAPAS
- **NapasTransactions**: Bản ghi giao dịch liên ngân hàng hoàn chỉnh với thông tin định tuyến
- **ReconciliationRecords**: Bản ghi thanh toán để kiểm toán và tuân thủ

### Dịch vụ Auth
- **Users**: Username, Password, BankCode, Role

### Migration Tự động Schema
Hệ thống bao gồm migration schema tự động khi khởi động. Khi các dịch vụ khởi động, chúng tự động:
- Kiểm tra xem cột `ErrorMessage` có tồn tại trong bảng Transactions không
- Thêm nó nếu thiếu mà không mất dữ liệu hiện có
- Ghi lại trạng thái migration ra console

Điều này có nghĩa là bạn không cần chạy migration thủ công hoặc reset database khi cập nhật lên phiên bản mới hơn.

## Yêu Cầu

- Docker Desktop (Windows/Mac) hoặc Docker Engine + Docker Compose (Linux)
- 8GB+ RAM khuyến nghị
- Các port khả dụng: 5000-5005, 5432-5436, 5672, 8080, 15672

## Khởi Động Nhanh

### 1. Khởi Động Tất Cả Dịch Vụ

```bash
docker-compose up --build
```

Lệnh này sẽ khởi động:
- 5 cơ sở dữ liệu PostgreSQL (ports 5432-5436)
- RabbitMQ (5672, 15672)
- Auth Service (5001)
- NAPAS Service (5002)
- Bank A Service (5003)
- Bank B Service (5004)
- Bank C Service (5005)
- API Gateway (5000)
- Multi-Bank Dashboard (8080)

### 2. Chờ Các Dịch Vụ

Chờ 15-30 giây để tất cả các dịch vụ sẵn sàng. Kiểm tra trạng thái:

```bash
# Kiểm tra tất cả dịch vụ đang chạy
docker-compose ps

# Kiểm tra health của dịch vụ
curl http://localhost:5001/health  # Auth
curl http://localhost:5002/health  # NAPAS
curl http://localhost:5003/health  # Bank A
curl http://localhost:5004/health  # Bank B
curl http://localhost:5005/health  # Bank C
```

### 3. Truy Cập Giao Diện Web

#### Multi-Bank Dashboard (Khuyến nghị)
- **URL**: http://localhost:8080
- **Tính năng**:
  - Dashboard thống nhất cho cả ba ngân hàng
  - Cập nhật thời gian thực qua SignalR
  - Chuyển đổi giữa các ngân hàng ngay lập tức
  - Kiểm tra giao dịch song song
  - Thông báo toast cho tất cả hoạt động

#### Giao Diện Riêng Từng Ngân Hàng (Tùy chọn)
Nếu bạn muốn, bạn vẫn có thể truy cập giao diện riêng của từng ngân hàng:

**Có bật Real-time**:
- **Ngân hàng A**: Mở `frontend/bank-a/index-signalr.html` trong trình duyệt
- **Ngân hàng B**: Mở `frontend/bank-b/index-signalr.html` trong trình duyệt
- **Ngân hàng C**: Mở `frontend/bank-c/index-signalr.html` trong trình duyệt

**Cơ bản (Không có Real-time)**:
- **Ngân hàng A**: Mở `frontend/bank-a/index.html` trong trình duyệt
- **Ngân hàng B**: Mở `frontend/bank-b/index.html` trong trình duyệt
- **Ngân hàng C**: Mở `frontend/bank-c/index.html` trong trình duyệt

#### Giao Diện Quản Lý
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

## Tài Khoản Demo

| Tên đăng nhập | Mật khẩu | Ngân hàng | Tài khoản Khả dụng |
|---------------|----------|-----------|-------------------|
| user_banka    | pass123  | BANKA  | BANKA001, BANKA002, BANKA003 |
| user_bankb    | pass123  | BANKB  | BANKB001, BANKB002, BANKB003 |
| user_bankc    | pass123  | BANKC  | BANKC001, BANKC002, BANKC003 |
| admin         | admin123 | NAPAS  | Truy cập Admin |

### Số Dư Tài Khoản (Ban đầu)

**Ngân hàng A**:
- BANKA001 (John Doe): $100,000
- BANKA002 (Jane Smith): $50,000
- BANKA003 (Bob Johnson): $75,000

**Ngân hàng B**:
- BANKB001 (Alice Williams): $100,000
- BANKB002 (Charlie Brown): $50,000
- BANKB003 (Diana Prince): $75,000

**Ngân hàng C**:
- BANKC001 (Eve Anderson): $100,000
- BANKC002 (Frank Miller): $50,000
- BANKC003 (Grace Lee): $75,000

## Tính Năng Thời Gian Thực (SignalR)

Hệ thống bao gồm các cập nhật thời gian thực sử dụng kết nối WebSocket SignalR, cung cấp thông báo tức thời cho tất cả hoạt động tài khoản.

### Tính Năng

1. **Cập Nhật Số Dư Trực Tiếp**
   - Số dư tự động cập nhật khi tiền được gửi hoặc nhận
   - Animation mượt mà khi số dư thay đổi
   - Không cần refresh thủ công

2. **Thông Báo Giao Dịch**
   - Thông báo toast cho chuyển tiền đến
   - Hiển thị ngân hàng gửi, tài khoản và số tiền
   - Thông báo cho chuyển tiền đi thành công

3. **Chỉ Báo Trạng Thái Kết Nối**
   - Chấm xanh: Đã kết nối (cập nhật thời gian thực hoạt động)
   - Chấm vàng: Đang kết nối/Kết nối lại
   - Chấm đỏ: Mất kết nối

4. **Kết Nối Lại Tự Động**
   - Tự động kết nối lại nếu mất kết nối
   - Đăng ký lại cập nhật tài khoản khi kết nối lại
   - Thông báo kết nối lại thân thiện với người dùng

### Cách Hoạt Động

1. **SignalR Hub**: Mỗi dịch vụ ngân hàng host một endpoint `/balanceHub`
2. **Đăng Ký Tài Khoản**: Client đăng ký số tài khoản của họ để nhận cập nhật
3. **Sự Kiện Thời Gian Thực**:
   - `BalanceUpdated`: Gửi khi số dư thay đổi (nội bộ hoặc liên ngân hàng)
   - `TransactionReceived`: Gửi khi nhận tiền từ ngân hàng khác
4. **Cơ Chế Broadcast**:
   - Sử dụng SignalR groups để nhắm đến chủ tài khoản cụ thể
   - Cả người gửi và người nhận đều nhận được cập nhật tức thì

### Sử Dụng Giao Diện Real-time

Đơn giản chỉ cần mở các file `index-signalr.html` thay vì `index.html` cơ bản:
- `frontend/bank-a/index-signalr.html`
- `frontend/bank-b/index-signalr.html`
- `frontend/bank-c/index-signalr.html`

Kết nối real-time tự động thiết lập sau khi đăng nhập!

## Ví Dụ Sử Dụng

### Chuyển Tiền Nội Bộ (Cùng Ngân hàng)

1. Đăng nhập vào Ngân hàng A với `user_banka` / `pass123`
2. Chọn tài khoản: `BANKA001`
3. Chọn loại chuyển tiền: "Internal (Same Bank)"
4. Nhập tài khoản đích: `BANKA002`
5. Nhập số tiền: `1000`
6. Nhập mô tả: "Test internal transfer"
7. Nhấn "Send Transfer"

**Kết quả**:
- Chuyển tiền thành công tức thì
- BANKA001: $99,000 (-$1,000)
- BANKA002: $51,000 (+$1,000)
- Giao dịch xuất hiện trong lịch sử với Status: SUCCESS

### Chuyển Tiền Liên Ngân Hàng (Qua NAPAS)

1. Vẫn đăng nhập Ngân hàng A
2. Chọn tài khoản: `BANKA001`
3. Chọn loại chuyển tiền: "Interbank (via NAPAS)"
4. Chọn ngân hàng đích: "Bank B"
5. Nhập tài khoản: `BANKB001`
6. Nhập số tiền: `5000`
7. Nhập mô tả: "Interbank transfer test"
8. Nhấn "Send Transfer"

**Kết quả**:
- Tin nhắn: "Transfer request sent to NAPAS"
- Transaction ID được trả về
- BANKA001: $94,000 (trừ ngay lập tức)
- Trạng thái: PENDING (xử lý bất đồng bộ)

**Xác minh**:
1. Chờ 2-3 giây
2. Mở Ngân hàng B (`user_bankb` / `pass123`)
3. Chọn tài khoản: `BANKB001`
4. Số dư: $105,000 (+$5,000)
5. Lịch sử giao dịch hiển thị chuyển tiền từ BANKA001
6. Quay lại Ngân hàng A, refresh → Trạng thái: SUCCESS

## API Endpoints

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
# Lấy danh sách tài khoản
GET /api/accounts

# Lấy tài khoản cụ thể
GET /api/accounts/{accountNumber}

# Lấy lịch sử giao dịch
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
# Lấy danh sách giao dịch
GET /api/transactions

# Lấy giao dịch cụ thể
GET /api/transactions/{transactionId}

# Lấy bản ghi đối soát
GET /api/reconciliation

# Lấy thống kê
GET /api/statistics
```

### Kiểm Tra Thống Kê NAPAS
```bash
curl http://localhost:5002/api/statistics
```

### Reset Database và Seed Dữ Liệu Mới
```bash
# Reset hoàn toàn (tạo lại bảng + seed dữ liệu)
curl -X POST http://localhost:5003/api/admin/reset
curl -X POST http://localhost:5004/api/admin/reset
curl -X POST http://localhost:5005/api/admin/reset

# Hoặc chỉ reseed dữ liệu (thay thế dữ liệu hiện có)
curl -X POST http://localhost:5003/api/admin/seed
curl -X POST http://localhost:5004/api/admin/seed
curl -X POST http://localhost:5005/api/admin/seed
```

## Giám Sát

### RabbitMQ Management Console
- URL: http://localhost:15672
- Username: guest
- Password: guest

**Các hàng đợi cần giám sát**:
- `transfer_napas`: Chuyển tiền đến từ ngân hàng đến NAPAS
- `transfer_banka`: Chuyển tiền được định tuyến đến Ngân hàng A
- `transfer_bankb`: Chuyển tiền được định tuyến đến Ngân hàng B
- `transfer_bankc`: Chuyển tiền được định tuyến đến Ngân hàng C
- `transfer_result`: Kết quả gửi lại từ các ngân hàng

### Truy Cập Database

Kết nối trực tiếp đến cơ sở dữ liệu PostgreSQL:

```bash
# Database Ngân hàng A
docker exec -it <postgres-banka-container> psql -U postgres -d bankadb

# Database NAPAS
docker exec -it <postgres-napas-container> psql -U postgres -d napasdb
```

## Khắc Phục Sự Cố

### Dịch vụ không khởi động
```bash
# Kiểm tra logs
docker-compose logs auth-service
docker-compose logs napas-service
docker-compose logs banka-service

# Khởi động lại dịch vụ cụ thể
docker-compose restart banka-service
```

### Vấn đề kết nối RabbitMQ
```bash
# Kiểm tra RabbitMQ đang chạy
docker-compose logs rabbitmq

# Khởi động lại RabbitMQ
docker-compose restart rabbitmq
```

### Vấn đề migration database
```bash
# Tạo lại databases
docker-compose down -v
docker-compose up --build
```

### Frontend không load hoặc vấn đề CORS

**Giải pháp Khuyến nghị**: Sử dụng Multi-Bank Dashboard web server có sẵn:
```bash
# Đơn giản truy cập http://localhost:8080 sau khi khởi động docker-compose
```

**Thay thế**: Serve file thủ công nếu cần:
```bash
# Python
cd frontend/bank-a && python -m http.server 8081

# Node.js
cd frontend/bank-a && npx http-server -p 8081
```

### Dashboard web server không khởi động
```bash
# Kiểm tra logs của dashboard container
docker-compose logs dashboard

# Rebuild dashboard container
docker-compose up -d --build dashboard
```

## Phát Triển

### Chạy không dùng Docker

#### Yêu cầu
- .NET 8 SDK
- PostgreSQL 15
- RabbitMQ

#### Cài đặt
```bash
# Cập nhật connection strings trong appsettings.Development.json cho mỗi dịch vụ

# Chạy Auth Service
cd src/AuthService/AuthService
dotnet run

# Chạy NAPAS Service
cd src/NapasService/NapasService
dotnet run

# Chạy Bank A Service
cd src/BankA/BankA
dotnet run

# Tương tự cho Bank B, Bank C, và API Gateway
```

## Mở Rộng Hệ Thống

### Thêm ngân hàng mới
1. Copy thư mục `src/BankA` → `src/BankD`
2. Đổi tên namespaces và cập nhật mã ngân hàng thành `BANKD`
3. Thêm database trong `docker-compose.yml`
4. Thêm service trong `docker-compose.yml`
5. Cập nhật routes API Gateway trong `ocelot.json`
6. Tạo frontend sử dụng template

### Thêm tính năng mới
- **Thông Báo SMS**: Tích hợp Twilio
- **Cảnh Báo Email**: Dịch vụ SMTP cho xác nhận giao dịch
- **Cập Nhật Thời Gian Thực**: SignalR cho cập nhật số dư trực tiếp
- **Giới Hạn Giao Dịch**: Giới hạn hàng ngày/tháng cho mỗi tài khoản
- **Đa Tiền Tệ**: Hỗ trợ VND, USD, EUR
- **Phát Hiện Gian Lận**: Machine learning cho các mẫu đáng ngờ
- **Chuyển Tiền Định Kỳ**: Cron jobs cho thanh toán lặp lại
- **Ứng Dụng Mobile**: React Native hoặc Flutter

## Cân Nhắc Cho Production

Đây là một **dự án demo/giáo dục**. Để triển khai production:

### Bảo Mật
- ❌ Loại bỏ thông tin đăng nhập hardcode
- ✅ Triển khai quản lý người dùng phù hợp với mật khẩu hash (BCrypt)
- ✅ Sử dụng JWT secret an toàn từ biến môi trường
- ✅ Thêm rate limiting và bảo vệ DDoS
- ✅ Triển khai xác thực/phân quyền API
- ✅ Sử dụng HTTPS/TLS cho mọi giao tiếp
- ✅ Mã hóa dữ liệu nhạy cảm

### Độ Tin Cậy
- ✅ Thêm retry logic với Polly
- ✅ Triển khai circuit breakers
- ✅ Thêm health checks và monitoring (Prometheus/Grafana)
- ✅ Sử dụng persistent volumes cho databases
- ✅ Triển khai logging phù hợp (Serilog + ELK stack)
- ✅ Thêm distributed tracing (OpenTelemetry)

### Khả Năng Mở Rộng
- ✅ Sử dụng Kubernetes cho orchestration
- ✅ Thêm Redis cho caching
- ✅ Triển khai database sharding
- ✅ Sử dụng message queue clustering
- ✅ Thêm load balancers

### Kiểm Thử
- ✅ Unit tests (xUnit)
- ✅ Integration tests
- ✅ End-to-end tests
- ✅ Load testing (k6, JMeter)

## Cập Nhật & Cải Tiến Gần Đây

### Multi-Bank Dashboard Web Server (Mới nhất)
**Tính năng**: Thêm web server dựa trên nginx cho Multi-Bank Dashboard
- Tự động phục vụ trên http://localhost:8080 qua Docker Compose
- Không cần mở file HTML thủ công hoặc chạy web server riêng
- Bao gồm health checks và header caching phù hợp
- Container nginx lightweight dựa trên Alpine
- Tích hợp vào docker-compose stack

**Lợi ích**:
- Truy cập dashboard thống nhất chỉ một cú nhấp chuột
- CORS và xử lý tài nguyên phù hợp
- Môi trường serving giống production
- Dễ chia sẻ và demo

### Đồng Bộ Trạng Thái Giao Dịch
**Vấn đề Đã Sửa**: Trước đây, khi Ngân hàng A gửi tiền đến Ngân hàng B, giao dịch sẽ giữ trạng thái "PENDING" ở Ngân hàng A ngay cả sau khi Ngân hàng B đã nhận thành công.

**Giải pháp Đã Triển khai**:
- NAPAS hiện gửi thông báo hoàn thành về ngân hàng nguồn
- Ngân hàng nguồn cập nhật trạng thái giao dịch từ PENDING sang SUCCESS/FAILED
- Thông báo SignalR thời gian thực (sự kiện `TransactionCompleted`) thông báo cho người dùng
- Đồng bộ trạng thái end-to-end đầy đủ qua tất cả hệ thống

### Migration Schema Tự Động
**Tính năng**: Cập nhật schema database hiện tự động khi khởi động
- Dịch vụ tự động thêm các cột mới (như `ErrorMessage`) nếu chúng không tồn tại
- Không cần reset database thủ công khi cập nhật code
- Dữ liệu hiện có được bảo toàn trong quá trình migration
- Trạng thái migration được ghi log ra console để minh bạch

### Quản Lý Trạng Thái Frontend
**Lỗi Đã Sửa**: Sửa lỗi hỏng mảng trong hàm deep merge của state manager
- Mảng hiện được thay thế đúng thay vì được merge đệ quy
- Ngăn chặn lỗi "accounts is not iterable"
- Cải thiện tính nhất quán trạng thái trong multi-bank dashboard

### Cải Tiến Admin Endpoints
**Hành Vi Đã Cập Nhật**:
- `/api/admin/reset` - Hiện tạo lại bảng VÀ seed dữ liệu trong một lệnh gọi (reset hoàn toàn)
- `/api/admin/seed` - Hiện thay thế tất cả dữ liệu hiện có bằng tài khoản demo mới
- `/api/admin/recreate-database` - Xóa và tạo lại bảng không seed (bảng sạch)

### Cấu Hình Docker
**Đã Sửa**: Thêm `ASPNETCORE_URLS=http://0.0.0.0:8080` cho tất cả dịch vụ
- Dịch vụ hiện lắng nghe đúng trên tất cả network interfaces trong Docker containers
- Sửa vấn đề CORS và kết nối giữa frontend và backend
- Cho phép giao tiếp phù hợp giữa các dịch vụ trong Docker network

## Giấy Phép

Dự án này dành cho mục đích giáo dục. Thoải mái sử dụng cho dự án capstone/luận văn đại học của bạn.

## Hỗ Trợ

Nếu có vấn đề hoặc câu hỏi, vui lòng tạo issue trong repository.

## Lời Cảm Ơn

Lấy cảm hứng từ hệ thống chuyển tiền liên ngân hàng NAPAS (Tổng Công ty Thanh toán Quốc gia Việt Nam) thực tế.

---

**Xây dựng với ❤️ để học kiến trúc microservices**
