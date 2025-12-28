# 📊 Chỉ Mục Sơ Đồ Hoàn Chỉnh

Tất cả sơ đồ kiến trúc và thiết kế cho Hệ Thống Chuyển Tiền Liên Ngân Hàng Nhanh 24/7 NAPAS.

## 📁 Thư Mục Diagrams

Vị trí: `/diagrams/`

Tổng cộng: **7 files** (6 file sơ đồ + 1 README)

---

## 🗂️ Sơ Đồ Entity Relationship (ERDs)

### 1️⃣ ERD Auth Service
**File**: `diagrams/01-erd-auth-service.md`

**Nội dung**:
- Schema bảng Users
- Thông tin đăng nhập xác thực
- Liên kết mã ngân hàng
- Truy cập dựa trên vai trò (User/Admin)
- Seed data cho 4 người dùng demo

**Bảng**:
- `USERS` (Id, Username, Password, BankCode, Role)

**Xem Online**: Hoàn hảo để hiển thị cấu trúc xác thực người dùng

---

### 2️⃣ ERD NAPAS Service
**File**: `diagrams/02-erd-napas-service.md`

**Nội dung**:
- Bảng NapasTransactions
- Bảng ReconciliationRecords
- Mối quan hệ giữa giao dịch và đối soát
- Indexes để tối ưu hiệu suất
- Quy tắc nghiệp vụ cho thanh toán

[Phần còn lại được dịch tương tự...]
