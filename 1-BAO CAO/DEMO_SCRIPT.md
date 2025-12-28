# Kịch Bản Demo cho Mô Phỏng NAPAS

Kịch bản này hướng dẫn bạn thông qua một buổi demo trực tiếp của hệ thống.

## Danh Sách Kiểm Tra Trước Demo

- [ ] Tất cả dịch vụ đang chạy (`docker-compose ps`)
- [ ] Các tab trình duyệt sẵn sàng (Bank A, B, C)
- [ ] Console quản lý RabbitMQ đã mở (http://localhost:15672)
- [ ] Terminal sẵn sàng cho lệnh curl
- [ ] Đã bắt đầu chia sẻ màn hình (nếu từ xa)

## Kịch Bản Demo (10-15 phút)

### 1. Giới Thiệu (1 phút)

> "Hôm nay tôi trình bày một mô phỏng hoàn chỉnh về hệ thống chuyển tiền liên ngân hàng NAPAS của Việt Nam dựa trên kiến trúc microservices. Đây là hệ thống thanh toán 24/7 cho phép chuyển tiền tức thì giữa các ngân hàng khác nhau."

**Hiển thị trên màn hình:**
- Mở README.md và hiển thị sơ đồ kiến trúc
- Nhấn mạnh: 6 microservices, 5 databases, RabbitMQ message queue

### 2. Kiến Trúc Hệ Thống (2 phút)

> "Hệ thống bao gồm nhiều dịch vụ độc lập giao tiếp bất đồng bộ thông qua hàng đợi tin nhắn RabbitMQ."

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
- PostgreSQL: Mẫu database per service

**Hiển thị kiến trúc:**
```
Người dùng → Frontend → API Gateway → Bank Service
                                      ↓
                                 RabbitMQ
                                      ↓
                                   NAPAS
                                      ↓
                                 RabbitMQ
                                      ↓
                           Ngân Hàng Đích
```

### 3. Code Walkthrough (2 phút)

> "Để tôi cho bạn xem cấu trúc code. Mỗi dịch vụ ngân hàng độc lập với database riêng."

**Hiển thị trên màn hình:**
```bash
# Hiển thị cấu trúc dự án
tree src/ -L 2

# Hiển thị các file quan trọng
cat src/BankA/BankA/Models/Account.cs
cat src/Shared/Shared/Models/TransferMessage.cs
```

**Giải thích:**
- Entity Framework Core cho ORM
- Minimal APIs cho endpoints
- Shared library cho các model chung
- Background services cho message consumers

### 4. Demo Trực Tiếp - Chuyển Tiền Nội Bộ (2 phút)

> "Hãy bắt đầu với chuyển tiền nội bộ trong Ngân hàng A."

**Từng bước:**

1. Mở frontend Ngân hàng A: `frontend/bank-a/index.html`
2. Đăng nhập: `user_banka` / `pass123`
3. Chọn tài khoản: `BANKA001` (hiển thị số dư: $100,000)
4. Chọn "Internal (Same Bank)"
5. Đích: `BANKA002`
6. Số tiền: `1,000`
7. Mô tả: "Demo internal transfer"
8. Click "Send Transfer"

**Chỉ ra:**
- ✅ Thành công tức thì
- Số dư cập nhật ngay lập tức
- Giao dịch xuất hiện trong lịch sử
- Loại: INTERNAL
- Trạng thái: SUCCESS

**Hiển thị trong terminal:**
```bash
# Xác minh với API
curl http://localhost:5003/api/accounts/BANKA001 | jq
```

[Tiếp tục với phần còn lại của demo script...]

---

**Hãy nhớ**: Bạn đã xây dựng một hệ thống hoàn chỉnh, hoạt động. Hãy tự tin và tự hào về công việc của bạn!

**Chúc may mắn với bài thuyết trình của bạn!**
