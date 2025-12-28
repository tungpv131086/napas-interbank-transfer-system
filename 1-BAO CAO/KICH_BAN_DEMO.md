# Kịch Bản Demo cho Hệ thống Mô phỏng NAPAS

Kịch bản này hướng dẫn bạn thực hiện demo trực tiếp hệ thống.

## Danh sách Kiểm tra Trước Demo

- [ ] Tất cả services đang chạy (`docker-compose ps`)
- [ ] Các tab trình duyệt đã sẵn sàng (Bank A, Bank B, Bank C)
- [ ] RabbitMQ management console đã mở (http://localhost:15672)
- [ ] Terminal sẵn sàng cho các lệnh curl
- [ ] Đã bắt đầu chia sẻ màn hình (nếu demo từ xa)

## Kịch bản Demo (10-15 phút)

### 1. Giới thiệu (1 phút)

> "Hôm nay tôi trình bày một hệ thống mô phỏng hoàn chỉnh về kiến trúc microservices cho hệ thống chuyển tiền liên ngân hàng NAPAS của Việt Nam. Đây là hệ thống thanh toán real-time 24/7 cho phép chuyển tiền tức thì giữa các ngân hàng khác nhau."

**Hiển thị trên màn hình:**
- Mở README.md và hiển thị sơ đồ kiến trúc
- Nhấn mạnh: 6 microservices, 5 databases, RabbitMQ message queue

### 2. Kiến trúc Hệ thống (2 phút)

> "Hệ thống bao gồm nhiều services độc lập giao tiếp bất đồng bộ thông qua RabbitMQ message queues."

**Hiển thị trên màn hình:**
```bash
docker-compose ps
```

**Giải thích:**
- Auth Service: Xác thực dựa trên JWT
- NAPAS Service: Trung tâm định tuyến
- Bank A, B, C: Ba ngân hàng độc lập
- API Gateway: Điểm vào duy nhất (Ocelot)
- RabbitMQ: Message broker bất đồng bộ
- PostgreSQL: Database per service pattern

**Hiển thị kiến trúc:**
```
User → Frontend → API Gateway → Bank Service
                                      ↓
                                 RabbitMQ
                                      ↓
                                   NAPAS
                                      ↓
                                 RabbitMQ
                                      ↓
                           Destination Bank
```

### 3. Tổng quan Code (2 phút)

> "Để cho các bạn thấy cấu trúc code. Mỗi bank service độc lập với database riêng."

**Hiển thị trên màn hình:**
```bash
# Hiển thị cấu trúc project
tree src/ -L 2

# Hiển thị các file quan trọng
cat src/BankA/BankA/Models/Account.cs
cat src/Shared/Shared/Models/TransferMessage.cs
```

**Giải thích:**
- Entity Framework Core cho ORM
- Minimal APIs cho endpoints
- Shared library cho các models chung
- Background services cho message consumers

### 4. Demo Trực tiếp - Chuyển tiền Nội bộ (2 phút)

> "Chúng ta bắt đầu với chuyển tiền nội bộ trong Bank A."

**Từng bước:**

1. Mở Bank A frontend: `frontend/bank-a/index.html`
2. Đăng nhập: `user_banka` / `pass123`
3. Chọn tài khoản: `BANKA001` (hiển thị số dư: $100,000)
4. Chọn "Internal (Same Bank)"
5. Tài khoản đích: `BANKA002`
6. Số tiền: `1,000`
7. Mô tả: "Demo internal transfer"
8. Nhấn "Send Transfer"

**Chỉ ra:**
- ✅ Thành công ngay lập tức
- Số dư cập nhật tức thì
- Giao dịch xuất hiện trong lịch sử
- Type: INTERNAL
- Status: SUCCESS

**Hiển thị trong terminal:**
```bash
# Kiểm tra với API
curl http://localhost:5003/api/accounts/BANKA001 | jq
```

### 5. Demo Trực tiếp - Chuyển tiền Liên Ngân hàng (3 phút)

> "Bây giờ là phần thú vị - chuyển tiền liên ngân hàng từ Bank A sang Bank B qua NAPAS."

**Từng bước:**

1. Vẫn trong Bank A frontend
2. Chọn tài khoản: `BANKA001`
3. Chọn "Interbank (via NAPAS)"
4. Ngân hàng đích: "Bank B"
5. Tài khoản: `BANKB001`
6. Số tiền: `5,000`
7. Mô tả: "Demo interbank transfer"
8. Nhấn "Send Transfer"

**Chỉ ra:**
- Thông báo: "Transfer request sent to NAPAS"
- Transaction ID được trả về
- Status: PENDING (xử lý bất đồng bộ)

**Hiển thị RabbitMQ:**
1. Mở http://localhost:15672 (guest/guest)
2. Vào tab Queues
3. Chỉ ra:
   - `transfer_napas` (nhận từ Bank A)
   - `transfer_bankb` (định tuyến đến Bank B)
   - `transfer_result` (kết quả về NAPAS)
4. Hiển thị số lượng message thay đổi

**Kiểm tra trong Bank B:**
1. Mở Bank B frontend: `frontend/bank-b/index.html`
2. Đăng nhập: `user_bankb` / `pass123`
3. Chọn tài khoản: `BANKB001`
4. Hiển thị số dư tăng $5,000
5. Hiển thị giao dịch trong lịch sử
   - From: BANKA001
   - Type: INTERBANK
   - Status: SUCCESS

**Hiển thị NAPAS:**
```bash
# Kiểm tra NAPAS đã ghi nhận giao dịch
curl http://localhost:5002/api/transactions | jq

# Hiển thị thống kê
curl http://localhost:5002/api/statistics | jq
```

### 6. Phân tích Kỹ thuật Sâu (2 phút)

> "Để tôi chỉ cho các bạn thấy điều gì đang xảy ra bên trong."

**Hiển thị luồng message:**
```bash
# Xem logs real-time
docker-compose logs -f banka-service napas-service bankb-service
```

**Thực hiện thêm một giao dịch và giải thích:**
1. Bank A trừ từ người gửi ngay lập tức
2. Bank A publish lên queue `transfer_napas`
3. NAPAS nhận và ghi log giao dịch
4. NAPAS định tuyến đến queue `transfer_bankb`
5. Bank B nhận và xử lý
6. Bank B cộng tiền cho người nhận
7. Bank B publish kết quả lên `transfer_result`
8. NAPAS cập nhật trạng thái và đối soát

**Hiển thị database:**
```bash
# Kết nối vào Bank A database
docker exec -it <container> psql -U postgres -d bankadb

# Query transactions
SELECT transactionid, fromaccountnumber, toaccountnumber, amount, status, type FROM transactions ORDER BY createdat DESC LIMIT 5;
```

### 7. Demo Xử lý Lỗi (1 phút)

> "Hệ thống xử lý lỗi một cách uyển chuyển."

**Demo tình huống lỗi:**
1. Thử chuyển đến tài khoản không hợp lệ: `BANKB999`
2. Hiển thị status: FAILED
3. Hiển thị error message trong lịch sử giao dịch

**Hiển thị trong RabbitMQ:**
- Message thất bại không biến mất
- Có thể được xử lý lại hoặc gửi đến dead letter queue

### 8. Đối soát & Thống kê (1 phút)

> "NAPAS duy trì bản ghi đầy đủ để thanh toán giữa các ngân hàng."

**Hiển thị trên màn hình:**
```bash
# Bản ghi đối soát
curl http://localhost:5002/api/reconciliation | jq

# Thống kê
curl http://localhost:5002/api/statistics | jq
```

**Giải thích:**
- Tổng số giao dịch
- Tỷ lệ thành công
- Tổng khối lượng đã chuyển
- Thông tin thanh toán
- Có thể tạo báo cáo theo ngày/tháng

### 9. Khả năng Mở rộng & Production (1 phút)

> "Kiến trúc này được thiết kế để mở rộng cho môi trường production."

**Giải thích trên bảng/slides:**
- Horizontal scaling: Nhiều instances cho mỗi service
- Load balancing với API Gateway
- Database read replicas
- RabbitMQ clustering
- Kubernetes deployment
- Monitoring với Prometheus/Grafana
- Logging với ELK stack

**Hiển thị những gì cần cho production:**
- BCrypt password hashing
- HTTPS/TLS
- Rate limiting
- Xử lý lỗi toàn diện
- Unit/integration tests
- CI/CD pipeline

### 10. Chuẩn bị Q&A (1 phút)

Sẵn sàng trả lời:

**Câu hỏi Kỹ thuật:**
- Q: Tại sao dùng RabbitMQ thay vì REST?
  - A: Bất đồng bộ, tách biệt, bền vững, message persistence

- Q: Tại sao mỗi service có database riêng?
  - A: Độc lập microservices, mô hình dữ liệu khác nhau, scale riêng biệt

- Q: Làm thế nào xử lý transaction failures?
  - A: Idempotency, retry logic, dead letter queues, compensating transactions

- Q: Vấn đề bảo mật?
  - A: Hiện tại là demo - cần BCrypt, HTTPS, rate limiting, input validation

**Câu hỏi Nghiệp vụ:**
- Q: Chuyển tiền nhanh như thế nào?
  - A: Nội bộ: tức thì (<100ms), Liên ngân hàng: 2-3 giây

- Q: Có xử lý được tải cao không?
  - A: Có, với horizontal scaling và load balancing

- Q: Khác biệt với thực tế?
  - A: NAPAS thực tế có fraud detection, SMS, KYC, báo cáo tuân thủ

## Mẹo Demo

### NÊN:
- ✅ Nói rõ ràng và tự tin
- ✅ Thể hiện sự nhiệt tình về công nghệ
- ✅ Giải thích giá trị nghiệp vụ, không chỉ kỹ thuật
- ✅ Sử dụng ví dụ thực tế
- ✅ Giữ terminal và browser ngăn nắp
- ✅ Test mọi thứ trước khi demo

### KHÔNG NÊN:
- ❌ Xin lỗi vì các tính năng "đơn giản"
- ❌ Đi quá sâu vào code trong khi demo
- ❌ Dành quá nhiều thời gian cho một thứ
- ❌ Bỏ qua câu hỏi đến cuối
- ❌ Quên hiển thị frontend UX

## Kế hoạch Dự phòng

Nếu có sự cố:

1. **Service down**: Hiển thị logs, giải thích vấn đề, tiếp tục với services khác
2. **Không có internet**: Mọi thứ chạy local, không vấn đề
3. **Frontend không load**: Dùng curl để chứng minh API hoạt động
4. **Vấn đề RabbitMQ**: Giải thích tính chất async, hiển thị logs
5. **Database corrupt**: Có backup database hoặc restart

## Sau Demo

Chuẩn bị sẵn:
- Link GitHub repository
- Links tài liệu
- Thông tin liên hệ
- Video demo (ghi lại demo này)
- Slides/bản trình bày

## Tiêu chí Đánh giá (cho Luận văn/Đồ án)

### Triển khai Kỹ thuật (40%)
- Kiến trúc microservices hoạt động
- Thiết kế database phù hợp
- Triển khai async message queue
- Thiết kế và tài liệu API
- Xử lý lỗi

### Thiết kế Hệ thống (30%)
- Cân nhắc khả năng mở rộng
- Độc lập của services
- Tính nhất quán dữ liệu
- Nhận thức về bảo mật
- Tối ưu hiệu năng

### Tài liệu (20%)
- README toàn diện
- Tài liệu kiến trúc
- Hướng dẫn testing
- Code comments
- Tài liệu API

### Trình bày (10%)
- Giải thích rõ ràng
- Demo trực tiếp
- Xử lý câu hỏi
- Quản lý thời gian
- Chuyên nghiệp

## Dấu hiệu Thành công

Bạn đã thành công nếu hội đồng/giảng viên:
1. Hiểu được kiến trúc microservices
2. Thấy được chuyển tiền nội bộ và liên ngân hàng hoạt động
3. Đánh giá cao thiết kế async message queue
4. Nhận ra tính ứng dụng thực tế
5. Đặt các câu hỏi kỹ thuật sâu

---

**Nhớ rằng**: Bạn đã xây dựng một hệ thống hoàn chỉnh, hoạt động tốt. Hãy tự tin và tự hào về công việc của mình!

**Chúc may mắn với bài thuyết trình!**
