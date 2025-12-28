# Triển Khai Tab Quản Trị

## Tổng Quan
Đã tạo tab Quản trị chuyên dụng không yêu cầu đăng nhập, với các công cụ để quản lý khởi tạo cơ sở dữ liệu và dữ liệu demo cho tất cả dịch vụ.

## Tính Năng Đã Triển Khai

### 1. API Endpoints Backend

#### Auth Service (`/home/ubuntu/ms/src/AuthService/AuthService/Program.cs`)
- `POST /api/auth/admin/create-tables` - Tạo bảng cơ sở dữ liệu nếu chưa tồn tại
- `POST /api/auth/admin/seed` - Seed 3 người dùng demo (user_banka, user_bankb, user_bankc)
- `POST /api/auth/admin/reset` - Xóa tất cả người dùng

#### Dịch vụ Ngân hàng (BankA, BankB, BankC)
- `POST /api/admin/create-tables` - Tạo bảng cơ sở dữ liệu nếu chưa tồn tại
- `POST /api/admin/seed` - Seed 3 tài khoản demo cho mỗi ngân hàng
- `POST /api/admin/reset` - Xóa tất cả tài khoản và giao dịch

### 2. Thay Đổi Frontend

#### BankManager (`/home/ubuntu/ms/frontend/multi-bank-dashboard/js/bank-manager.js`)
- Thêm phương thức `createTables()` để gọi endpoint create-tables

#### UI Manager (`/home/ubuntu/ms/frontend/multi-bank-dashboard/js/ui-manager.js`)
- Thêm tab Admin làm tab đầu tiên (active theo mặc định)
- Tạo phương thức `renderAdminPanel()` để render công cụ admin
- Thêm `attachAdminEventListeners()` để kết nối buttons với handlers
- Loại bỏ công cụ admin khỏi dashboard ngân hàng riêng lẻ
- Triển khai các handlers:
  - `handleAuthCreateTables()` - Tạo bảng Auth Service
  - `handleAuthSeed()` - Seed người dùng Auth Service
  - `handleAuthReset()` - Reset người dùng Auth Service
  - `handleBankCreateTables(bankCode)` - Tạo bảng ngân hàng
  - `handleBankSeed(bankCode)` - Seed tài khoản ngân hàng (đổi tên từ handleSeedData)
  - `handleBankReset(bankCode)` - Reset dữ liệu ngân hàng (đổi tên từ handleResetData)

#### CSS (`/home/ubuntu/ms/frontend/multi-bank-dashboard/css/dashboard.css`)
- Thêm styling cho tab admin (viền cam khi active)
- Thêm styling cho card admin panel với hiệu ứng hover
- Thêm class `.alert-sm` cho alerts nhỏ gọn

## Cách Sử Dụng

1. **Khởi động các dịch vụ:**
   ```bash
   docker compose up -d
   ```

2. **Mở dashboard:**
   Truy cập `http://localhost:8080`

3. **Sử dụng Tab Admin (Không cần đăng nhập):**
   - Click vào tab "⚙️ Admin"
   - Cho mỗi dịch vụ (Auth, Bank A, Bank B, Bank C):
     - Click "🛠️ Create Tables" để khởi tạo database
     - Click "🌱 Seed" để thêm dữ liệu demo
     - Click "🔄 Reset" để xóa tất cả dữ liệu

4. **Đăng nhập vào Ngân hàng:**
   - Chuyển sang tab Bank A, B, hoặc C
   - Đăng nhập với thông tin đã điền sẵn
   - Quản lý tài khoản và chuyển tiền

## Người Dùng Demo (Sau Khi Seed Auth Service)
- Username: `user_banka`, Password: `pass123`
- Username: `user_bankb`, Password: `pass123`
- Username: `user_bankc`, Password: `pass123`

## Tài Khoản Demo (Sau Khi Seed Mỗi Ngân Hàng)

### Ngân hàng A
- BANKA001 - John Doe - $100,000
- BANKA002 - Jane Smith - $50,000
- BANKA003 - Bob Johnson - $75,000

### Ngân hàng B
- BANKB001 - Alice Williams - $100,000
- BANKB002 - Charlie Brown - $50,000
- BANKB003 - Diana Prince - $75,000

### Ngân hàng C
- BANKC001 - Eve Anderson - $100,000
- BANKC002 - Frank Miller - $50,000
- BANKC003 - Grace Lee - $75,000

## Khắc Phục Sự Cố

### Lỗi "relation does not exist"
1. Vào tab Admin
2. Click "Create Tables" cho dịch vụ bị ảnh hưởng
3. Chờ thông báo thành công
4. Click "Seed" để thêm dữ liệu demo

### Cần dữ liệu mới
1. Vào tab Admin
2. Click "Reset" cho dịch vụ
3. Click "Seed" để tạo lại dữ liệu demo
