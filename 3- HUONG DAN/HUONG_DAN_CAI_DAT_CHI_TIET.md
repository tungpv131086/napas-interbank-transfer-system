# HƯỚNG DẪN CÀI ĐẶT VÀ SỬ DỤNG HỆ THỐNG
## HỆ THỐNG CHUYỂN TIỀN LIÊN NGÂN HÀNG QUA NAPAS

---

## 📋 MỤC LỤC

1. [Giới thiệu](#1-giới-thiệu)
2. [Yêu cầu hệ thống](#2-yêu-cầu-hệ-thống)
3. [Cài đặt Docker Desktop](#3-cài-đặt-docker-desktop)
4. [Tải và giải nén source code](#4-tải-và-giải-nén-source-code)
5. [Khởi động hệ thống](#5-khởi-động-hệ-thống)
6. [Truy cập và sử dụng](#6-truy-cập-và-sử-dụng)
7. [Hướng dẫn sử dụng chi tiết](#7-hướng-dẫn-sử-dụng-chi-tiết)
8. [Xử lý sự cố](#8-xử-lý-sự-cố)
9. [Dừng và xóa hệ thống](#9-dừng-và-xóa-hệ-thống)

---

## 1. GIỚI THIỆU

### 1.1. Hệ thống là gì?

Đây là hệ thống **mô phỏng chuyển tiền liên ngân hàng** giống như hệ thống NAPAS thực tế tại Việt Nam. Hệ thống bao gồm:

- ✅ **6 microservices** chạy độc lập
- ✅ **3 ngân hàng** (Bank A, Bank B, Bank C)
- ✅ **1 trung tâm thanh toán** (NAPAS)
- ✅ **1 dịch vụ xác thực** (Auth Service)
- ✅ **1 cổng API** (API Gateway)
- ✅ **5 cơ sở dữ liệu** PostgreSQL
- ✅ **1 message queue** RabbitMQ
- ✅ **1 giao diện web** đẹp và dễ sử dụng

### 1.2. Tính năng chính

- 💰 **Chuyển tiền nội bộ** (trong cùng ngân hàng) - Tức thì < 100ms
- 🏦 **Chuyển tiền liên ngân hàng** (qua NAPAS) - 2-3 giây
- 📊 **Xem lịch sử giao dịch** đầy đủ
- 🔔 **Thông báo real-time** khi có giao dịch mới
- 📈 **Dashboard thống nhất** cho 3 ngân hàng

---

## 2. YÊU CẦU HỆ THỐNG

### 2.1. Phần cứng

| Thành phần | Tối thiểu | Khuyến nghị |
|------------|-----------|-------------|
| **CPU** | 2 cores | 4 cores |
| **RAM** | 8 GB | 16 GB |
| **Ổ cứng trống** | 10 GB | 20 GB |
| **Internet** | Cần (để tải Docker) | Băng thông ổn định |

### 2.2. Hệ điều hành

Hệ thống hỗ trợ:

- ✅ **Windows 10/11** (64-bit)
- ✅ **macOS** Catalina (10.15) trở lên
- ✅ **Linux** Ubuntu 20.04 trở lên

### 2.3. Phần mềm cần có

| Phần mềm | Phiên bản | Bắt buộc | Ghi chú |
|----------|-----------|----------|---------|
| **Docker Desktop** | 24.0+ | ✅ Bắt buộc | Công cụ chạy containers |
| **Trình duyệt web** | Mới nhất | ✅ Bắt buộc | Chrome, Firefox, Edge, Safari |
| **Git** | 2.30+ | ⭐ Khuyến nghị | Để clone source code |
| **VS Code** | Mới nhất | ⭐ Tùy chọn | Để xem/chỉnh sửa code |

---

## 3. CÀI ĐẶT DOCKER DESKTOP

Docker Desktop là phần mềm **BẮT BUỘC** để chạy hệ thống. Hãy làm theo hướng dẫn cho hệ điều hành của bạn:

### 3.1. Cài đặt trên Windows

#### **Bước 1: Tải Docker Desktop**

1. Mở trình duyệt web
2. Truy cập: https://www.docker.com/products/docker-desktop/
3. Nhấn nút **"Download for Windows"**
4. Chờ file tải xuống (khoảng 500MB)

#### **Bước 2: Cài đặt Docker Desktop**

1. Mở file **Docker Desktop Installer.exe** vừa tải
2. Nhấn **"Ok"** để bắt đầu cài đặt
3. Chọn **"Use WSL 2 instead of Hyper-V"** (nếu được hỏi)
4. Chờ quá trình cài đặt hoàn tất (5-10 phút)
5. Nhấn **"Close and restart"** khi hoàn tất

#### **Bước 3: Khởi động Docker Desktop**

1. Máy tính sẽ tự động khởi động lại
2. Sau khi khởi động lại, mở **Docker Desktop** từ Start Menu
3. Chấp nhận **Docker Subscription Service Agreement**
4. Chọn **"Skip"** khi được hỏi đăng nhập (không bắt buộc)
5. Chờ Docker khởi động (biểu tượng cá voi ở system tray sẽ không còn nhấp nháy)

#### **Bước 4: Kiểm tra cài đặt**

1. Mở **Command Prompt** hoặc **PowerShell**:
   - Nhấn `Windows + R`
   - Gõ `cmd` và nhấn Enter
   
2. Gõ lệnh sau và nhấn Enter:
   ```bash
   docker --version
   ```

3. Nếu thấy kết quả giống như:
   ```
   Docker version 24.0.6, build ed223bc
   ```
   ➡️ **Cài đặt thành công!** ✅

4. Tiếp tục kiểm tra Docker Compose:
   ```bash
   docker-compose --version
   ```

5. Nếu thấy:
   ```
   Docker Compose version v2.20.3
   ```
   ➡️ **Hoàn tất!** ✅

---

### 3.2. Cài đặt trên macOS

#### **Bước 1: Tải Docker Desktop**

1. Kiểm tra chip của Mac:
   - Nhấn biểu tượng  (Apple) ở góc trên bên trái
   - Chọn **"About This Mac"**
   - Xem dòng **"Chip"** hoặc **"Processor"**:
     - Nếu thấy **"Apple M1/M2/M3"** → Chip Apple Silicon
     - Nếu thấy **"Intel"** → Chip Intel

2. Truy cập: https://www.docker.com/products/docker-desktop/

3. Tải phiên bản phù hợp:
   - **Mac with Apple chip** (M1/M2/M3)
   - **Mac with Intel chip**

#### **Bước 2: Cài đặt Docker Desktop**

1. Mở file **Docker.dmg** vừa tải
2. Kéo biểu tượng **Docker** vào thư mục **Applications**
3. Mở **Applications** folder
4. Double-click **Docker** để mở
5. Nhập mật khẩu Mac nếu được yêu cầu
6. Nhấn **"Open"** nếu có cảnh báo bảo mật

#### **Bước 3: Cấu hình Docker**

1. Chấp nhận **Docker Subscription Service Agreement**
2. Chọn **"Skip"** khi được hỏi đăng nhập
3. Chờ Docker khởi động (biểu tượng cá voi ở menu bar)

#### **Bước 4: Kiểm tra cài đặt**

1. Mở **Terminal**:
   - Nhấn `Cmd + Space`
   - Gõ `Terminal` và nhấn Enter

2. Gõ lệnh:
   ```bash
   docker --version
   docker-compose --version
   ```

3. Nếu thấy phiên bản hiển thị → **Thành công!** ✅

---

### 3.3. Cài đặt trên Linux (Ubuntu)

#### **Bước 1: Cập nhật hệ thống**

Mở Terminal và chạy:

```bash
sudo apt update
sudo apt upgrade -y
```

#### **Bước 2: Cài đặt Docker Engine**

```bash
# Cài đặt các gói cần thiết
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y

# Thêm Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Thêm Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Cài đặt Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io -y
```

#### **Bước 3: Cài đặt Docker Compose**

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose
```

#### **Bước 4: Cấu hình quyền**

```bash
# Thêm user vào group docker
sudo usermod -aG docker $USER

# Khởi động Docker
sudo systemctl start docker
sudo systemctl enable docker

# Logout và login lại để áp dụng quyền
```

#### **Bước 5: Kiểm tra**

```bash
docker --version
docker-compose --version
```

---

## 4. TẢI VÀ GIẢI NÉN SOURCE CODE

### 4.1. Nếu bạn có file ZIP

#### **Windows:**

1. Giải nén file ZIP (chuột phải → **Extract All...**)
2. Chọn thư mục đích (ví dụ: `C:\Users\YourName\Documents\`)
3. Nhấn **Extract**
4. Mở thư mục vừa giải nén, vào folder **"2- SOURCE CODE"**

#### **macOS/Linux:**

1. Double-click file ZIP để giải nén
2. Hoặc dùng lệnh:
   ```bash
   unzip Napas_simulation.zip -d ~/Documents/
   cd ~/Documents/Napas\ simulation/2-\ SOURCE\ CODE/
   ```

---

### 4.2. Nếu sử dụng Git (Khuyến nghị)

#### **Bước 1: Cài đặt Git** (nếu chưa có)

**Windows:**
- Tải từ: https://git-scm.com/download/win
- Cài đặt với các tùy chọn mặc định

**macOS:**
```bash
brew install git
```

**Linux:**
```bash
sudo apt install git -y
```

#### **Bước 2: Clone repository**

```bash
# Tạo thư mục cho project
mkdir ~/projects
cd ~/projects

# Clone source code (nếu có Git repository)
# git clone <repository-url>

# Hoặc copy source code vào thư mục này
```

---

## 5. KHỞI ĐỘNG HỆ THỐNG

### 5.1. Mở Terminal/Command Prompt

#### **Windows:**
1. Mở thư mục **"2- SOURCE CODE"**
2. Giữ phím `Shift` + Chuột phải vào vùng trống
3. Chọn **"Open PowerShell window here"** hoặc **"Open in Terminal"**

#### **macOS/Linux:**
1. Mở **Terminal**
2. Di chuyển vào thư mục source code:
   ```bash
   cd ~/Documents/Napas\ simulation/2-\ SOURCE\ CODE/
   ```

---

### 5.2. Kiểm tra Docker đang chạy

**Trước khi khởi động hệ thống**, hãy đảm bảo Docker Desktop đang chạy:

#### **Windows/macOS:**
- Kiểm tra biểu tượng Docker (cá voi) ở system tray/menu bar
- Biểu tượng không nhấp nháy → Docker đã sẵn sàng ✅

#### **Linux:**
```bash
sudo systemctl status docker
```
- Nếu thấy **"active (running)"** → OK ✅

---

### 5.3. Khởi động toàn bộ hệ thống

Chạy lệnh sau trong Terminal/PowerShell:

```bash
docker-compose up -d --build
```

**Giải thích lệnh:**
- `docker-compose`: Công cụ quản lý nhiều containers
- `up`: Khởi động các services
- `-d`: Chạy ở chế độ background (detached)
- `--build`: Build lại images nếu có thay đổi

---

### 5.4. Quá trình khởi động

**Lần đầu tiên** (15-20 phút):
1. ⏳ Tải base images (PostgreSQL, RabbitMQ, .NET, Nginx)
2. 🔨 Build 6 microservices từ source code
3. 🗄️ Tạo 5 databases
4. 🚀 Khởi động tất cả containers
5. ✅ Seed dữ liệu mẫu

**Các lần sau** (2-3 phút):
- Sử dụng lại images đã build
- Chỉ khởi động containers

---

### 5.5. Kiểm tra trạng thái hệ thống

#### **Kiểm tra containers đang chạy:**

```bash
docker-compose ps
```

**Kết quả mong muốn:** Tất cả services đều có trạng thái **"Up"**

```
NAME                  STATUS
auth-service          Up
napas-service         Up
banka-service         Up
bankb-service         Up
bankc-service         Up
api-gateway           Up
dashboard             Up
rabbitmq              Up
postgres-auth         Up
postgres-napas        Up
postgres-banka        Up
postgres-bankb        Up
postgres-bankc        Up
```

#### **Xem logs:**

```bash
# Xem logs tất cả services
docker-compose logs -f

# Xem logs của service cụ thể
docker-compose logs -f banka-service
```

**Dấu hiệu thành công:**
- ✅ Thấy dòng: `Application started. Press Ctrl+C to shut down.`
- ✅ Không có lỗi màu đỏ

---

### 5.6. Kiểm tra health endpoints

Mở trình duyệt và truy cập các URL sau để kiểm tra:

| Service | URL | Kết quả mong muốn |
|---------|-----|-------------------|
| Auth Service | http://localhost:5001/health | `Healthy` |
| NAPAS Service | http://localhost:5002/health | `Healthy` |
| Bank A Service | http://localhost:5003/health | `Healthy` |
| Bank B Service | http://localhost:5004/health | `Healthy` |
| Bank C Service | http://localhost:5005/health | `Healthy` |
| API Gateway | http://localhost:5000/ | Ocelot response |

Nếu **TẤT CẢ** đều trả về kết quả → **Hệ thống sẵn sàng!** 🎉

---

## 6. TRUY CẬP VÀ SỬ DỤNG

### 6.1. Truy cập giao diện web

#### **Cách 1: Multi-Bank Dashboard (Khuyến nghị)** ⭐

1. Mở trình duyệt web
2. Truy cập: **http://localhost:8080**
3. Bạn sẽ thấy giao diện dashboard đẹp mắt

**Tính năng:**
- ✅ Quản lý 3 ngân hàng trong 1 giao diện
- ✅ Chuyển đổi ngân hàng nhanh chóng
- ✅ Cập nhật real-time qua SignalR
- ✅ Thông báo toast cho mọi giao dịch

#### **Cách 2: Giao diện riêng từng ngân hàng**

Nếu muốn, bạn có thể mở file HTML trực tiếp:

**Bank A:**
- Mở file: `frontend/bank-a/index-signalr.html` bằng trình duyệt

**Bank B:**
- Mở file: `frontend/bank-b/index-signalr.html`

**Bank C:**
- Mở file: `frontend/bank-c/index-signalr.html`

---

### 6.2. Đăng nhập vào hệ thống

#### **Tài khoản demo có sẵn:**

| Username | Password | Ngân hàng | Vai trò |
|----------|----------|-----------|---------|
| `user_banka` | `pass123` | Bank A | User |
| `user_bankb` | `pass123` | Bank B | User |
| `user_bankc` | `pass123` | Bank C | User |
| `admin` | `admin123` | NAPAS | Admin |

#### **Hướng dẫn đăng nhập:**

1. Mở http://localhost:8080
2. Nhập **Username**: `user_banka`
3. Nhập **Password**: `pass123`
4. Nhấn nút **"Login"**
5. Bạn sẽ thấy dashboard của Bank A với 3 tài khoản

---

### 6.3. Danh sách tài khoản có sẵn

#### **Bank A:**

| Số tài khoản | Chủ tài khoản | Số dư ban đầu |
|--------------|---------------|---------------|
| BANKA001 | John Doe | $100,000 |
| BANKA002 | Jane Smith | $50,000 |
| BANKA003 | Bob Johnson | $75,000 |

#### **Bank B:**

| Số tài khoản | Chủ tài khoản | Số dư ban đầu |
|--------------|---------------|---------------|
| BANKB001 | Alice Williams | $100,000 |
| BANKB002 | Charlie Brown | $50,000 |
| BANKB003 | Diana Prince | $75,000 |

#### **Bank C:**

| Số tài khoản | Chủ tài khoản | Số dư ban đầu |
|--------------|---------------|---------------|
| BANKC001 | Eve Anderson | $100,000 |
| BANKC002 | Frank Miller | $50,000 |
| BANKC003 | Grace Lee | $75,000 |

---

### 6.4. Truy cập RabbitMQ Management Console

RabbitMQ là hệ thống message queue, bạn có thể xem trực quan các message đang được xử lý:

1. Truy cập: **http://localhost:15672**
2. Đăng nhập:
   - **Username**: `guest`
   - **Password**: `guest`
3. Click tab **"Queues"** để xem các hàng đợi:
   - `transfer_napas` - Yêu cầu chuyển tiền từ ngân hàng
   - `transfer_banka` - Định tuyến đến Bank A
   - `transfer_bankb` - Định tuyến đến Bank B
   - `transfer_bankc` - Định tuyến đến Bank C
   - `transfer_result` - Kết quả từ ngân hàng

---

## 7. HƯỚNG DẪN SỬ DỤNG CHI TIẾT

### 7.1. Xem thông tin tài khoản

1. Sau khi đăng nhập, bạn sẽ thấy danh sách tài khoản
2. Mỗi tài khoản hiển thị:
   - ✅ Số tài khoản
   - ✅ Tên chủ tài khoản
   - ✅ Số dư hiện tại
   - ✅ Ngày tạo

---

### 7.2. Chuyển tiền nội bộ (Cùng ngân hàng)

**Ví dụ:** Chuyển tiền từ BANKA001 sang BANKA002

#### **Bước 1: Nhấn nút "Transfer"**

- Tìm tài khoản **BANKA001**
- Nhấn nút **"Transfer"** bên cạnh

#### **Bước 2: Điền form chuyển tiền**

- **To Account Number**: `BANKA002`
- **Amount**: `5000` (tức $5,000)
- **Description**: `Thanh toan hoa don` (tùy chọn)

#### **Bước 3: Chọn loại chuyển khoản**

- Chọn **"Internal Transfer"** (Chuyển tiền nội bộ)

#### **Bước 4: Xác nhận**

- Nhấn nút **"Submit Transfer"**

#### **Bước 5: Xem kết quả**

- ⚡ Giao dịch hoàn tất **ngay lập tức** (< 100ms)
- ✅ Thông báo toast: "Transfer successful!"
- 💰 Số dư **BANKA001** giảm $5,000 → $95,000
- 💰 Số dư **BANKA002** tăng $5,000 → $55,000
- 📊 Lịch sử giao dịch được cập nhật

---

### 7.3. Chuyển tiền liên ngân hàng (Qua NAPAS)

**Ví dụ:** Chuyển tiền từ Bank A sang Bank B

#### **Bước 1: Chuẩn bị**

- Đăng nhập bằng `user_banka` / `pass123`
- Chọn tài khoản **BANKA001** để chuyển

#### **Bước 2: Nhấn "Transfer"**

#### **Bước 3: Điền thông tin**

- **To Bank Code**: `BANKB` (chọn từ dropdown)
- **To Account Number**: `BANKB001`
- **Amount**: `10000` ($10,000)
- **Description**: `Chuyen tien lien ngan hang`

#### **Bước 4: Chọn loại**

- Chọn **"Interbank Transfer"** (Chuyển liên ngân hàng)

#### **Bước 5: Xác nhận**

- Nhấn **"Submit Transfer"**

#### **Bước 6: Xem quá trình**

**Timeline:**

```
0ms    → Trừ tiền BANKA001: $100,000 → $90,000
100ms  → User nhận response: "Transfer initiated (PENDING)"
500ms  → Bank A gửi message đến NAPAS qua RabbitMQ
1000ms → NAPAS định tuyến message đến Bank B
1500ms → Bank B nhận message và xử lý
2000ms → Bank B cộng tiền BANKB001: $100,000 → $110,000
2500ms → Bank B gửi kết quả về NAPAS
3000ms → NAPAS cập nhật status: SUCCESS
3000ms → 🔔 User nhận thông báo real-time: "Transfer completed!"
```

**Kết quả:**
- ✅ Trạng thái: `PENDING` → `SUCCESS`
- 💰 BANKA001: $90,000 (đã trừ)
- 💰 BANKB001: $110,000 (đã cộng)
- 📊 Lịch sử giao dịch ở cả 2 ngân hàng

---

### 7.4. Xem lịch sử giao dịch

#### **Bước 1: Nhấn "View Transactions"**

- Tìm tài khoản muốn xem
- Nhấn nút **"View Transactions"**

#### **Bước 2: Bộ lọc**

Bạn có thể lọc theo:
- **All**: Tất cả giao dịch
- **Internal**: Chỉ giao dịch nội bộ
- **Interbank**: Chỉ giao dịch liên ngân hàng

#### **Bước 3: Xem chi tiết**

Mỗi giao dịch hiển thị:
- 🆔 Transaction ID (GUID)
- 📤 From Account (Tài khoản gửi)
- 📥 To Account (Tài khoản nhận)
- 🏦 To Bank Code (nếu là interbank)
- 💵 Amount (Số tiền)
- 📝 Description (Mô tả)
- 📊 Status (PENDING/SUCCESS/FAILED)
- 🕐 Created At (Thời gian tạo)
- ✅ Completed At (Thời gian hoàn tất)

---

### 7.5. Chuyển đổi giữa các ngân hàng

Nếu sử dụng **Multi-Bank Dashboard**:

1. Nhấn nút **"Logout"** ở góc trên phải
2. Đăng nhập lại với tài khoản khác:
   - `user_bankb` / `pass123` → Bank B
   - `user_bankc` / `pass123` → Bank C

---

### 7.6. Kiểm tra giao dịch song song (Demo Real-time)

**Mục đích:** Xem tính năng real-time SignalR hoạt động

#### **Bước 1: Mở 2 cửa sổ trình duyệt**

- **Cửa sổ 1:** http://localhost:8080 → Đăng nhập Bank A
- **Cửa sổ 2:** http://localhost:8080 → Đăng nhập Bank B (dùng Incognito/Private mode)

#### **Bước 2: Sắp xếp 2 cửa sổ cạnh nhau**

#### **Bước 3: Thực hiện chuyển tiền**

- Từ **Cửa sổ 1** (Bank A): Chuyển $1,000 từ BANKA001 → BANKB001

#### **Bước 4: Quan sát**

**Cửa sổ 1 (Bank A):**
- ⚡ Số dư BANKA001 giảm ngay lập tức
- 🔔 Toast: "Transfer initiated"
- ⏱️ Sau 3 giây: Toast "Transfer completed!"

**Cửa sổ 2 (Bank B):**
- ⏱️ Sau 2-3 giây:
- 🔔 Toast: "Received $1,000 from BANKA"
- 💰 Số dư BANKB001 tăng tự động (không cần refresh!)

→ **Đây là tính năng Real-time!** 🎉

---

## 8. XỬ LÝ SỰ CỐ

### 8.1. Container không khởi động

#### **Triệu chứng:**
```bash
docker-compose ps
```
Một số container có status **"Exited"** hoặc **"Restarting"**

#### **Giải pháp:**

**Bước 1: Xem logs**
```bash
docker-compose logs <service-name>
```

Ví dụ:
```bash
docker-compose logs banka-service
```

**Bước 2: Kiểm tra lỗi thường gặp**

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| `port already in use` | Port đang bị dùng | Đóng app khác hoặc đổi port |
| `database connection failed` | Database chưa sẵn sàng | Chờ 30s rồi restart |
| `RabbitMQ connection failed` | RabbitMQ chưa sẵn sàng | Restart RabbitMQ |

**Bước 3: Restart service**
```bash
docker-compose restart banka-service
```

**Bước 4: Nếu vẫn lỗi, rebuild**
```bash
docker-compose up -d --build banka-service
```

---

### 8.2. Port bị chiếm dụng

#### **Triệu chứng:**
```
Error: bind: address already in use
```

#### **Giải pháp:**

**Windows:**
```powershell
# Tìm process đang dùng port 5000
netstat -ano | findstr :5000

# Kill process (thay <PID> bằng số Process ID)
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
# Tìm process đang dùng port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

**Hoặc đơn giản:**
- Restart máy tính
- Chạy lại `docker-compose up -d --build`

---

### 8.3. Database connection failed

#### **Triệu chứng:**
```
Npgsql.NpgsqlException: Connection refused
```

#### **Giải pháp:**

**Bước 1: Kiểm tra PostgreSQL containers**
```bash
docker-compose ps | grep postgres
```

Tất cả phải **"Up"**

**Bước 2: Restart databases**
```bash
docker-compose restart postgres-auth postgres-napas postgres-banka postgres-bankb postgres-bankc
```

**Bước 3: Chờ 30 giây**

Databases cần thời gian khởi động

**Bước 4: Restart services**
```bash
docker-compose restart auth-service napas-service banka-service bankb-service bankc-service
```

---

### 8.4. RabbitMQ connection failed

#### **Triệu chứng:**
```
RabbitMQ.Client.Exceptions.BrokerUnreachableException
```

#### **Giải pháp:**

**Bước 1: Kiểm tra RabbitMQ**
```bash
docker-compose logs rabbitmq
```

Tìm dòng:
```
Server startup complete
```

**Bước 2: Nếu chưa thấy, restart RabbitMQ**
```bash
docker-compose restart rabbitmq
```

**Bước 3: Chờ 30 giây**

**Bước 4: Restart các services sử dụng RabbitMQ**
```bash
docker-compose restart napas-service banka-service bankb-service bankc-service
```

---

### 8.5. Frontend không hiển thị hoặc lỗi CORS

#### **Triệu chứng:**
- Trang web trắng xóa
- Console lỗi: `CORS policy blocked`
- Không load được API

#### **Giải pháp:**

**Bước 1: Kiểm tra dashboard container**
```bash
docker-compose logs dashboard
```

**Bước 2: Restart dashboard**
```bash
docker-compose restart dashboard
```

**Bước 3: Xóa cache trình duyệt**

**Chrome/Edge:**
- Nhấn `Ctrl + Shift + Delete` (Windows) hoặc `Cmd + Shift + Delete` (Mac)
- Chọn **"Cached images and files"**
- Nhấn **"Clear data"**
- Refresh trang (F5)

**Firefox:**
- Nhấn `Ctrl + Shift + Delete`
- Chọn **"Cache"**
- Nhấn **"Clear Now"**

**Bước 4: Thử trình duyệt khác**

Đôi khi Chrome cache mạnh, thử Firefox hoặc Edge

---

### 8.6. Giao dịch bị "PENDING" mãi

#### **Triệu chứng:**
- Chuyển tiền liên ngân hàng
- Trạng thái `PENDING` không chuyển sang `SUCCESS`

#### **Giải pháp:**

**Bước 1: Kiểm tra RabbitMQ Management**
1. Truy cập http://localhost:15672
2. Đăng nhập `guest` / `guest`
3. Click tab **"Queues"**
4. Kiểm tra các queue có messages **"Ready"** không

**Bước 2: Nếu có messages tồn đọng**

Có thể consumer service bị crash

```bash
# Kiểm tra logs NAPAS
docker-compose logs napas-service

# Kiểm tra logs Bank đích
docker-compose logs bankb-service
```

**Bước 3: Restart services**
```bash
docker-compose restart napas-service banka-service bankb-service bankc-service
```

**Bước 4: Purge queues (nếu cần)**

Vào RabbitMQ Management → Queues → Chọn queue → **Purge Messages**

---

### 8.7. Số dư không cập nhật real-time

#### **Triệu chứng:**
- Chuyển tiền thành công
- Nhưng số dư không tự động cập nhật
- Phải refresh (F5) mới thấy

#### **Giải pháp:**

**Bước 1: Kiểm tra SignalR connection**

Mở **Developer Tools** (F12) → Tab **Console**

Tìm dòng:
```
SignalR Connected!
```

Nếu thấy:
```
SignalR connection failed
```

→ Lỗi WebSocket

**Bước 2: Kiểm tra bank service logs**
```bash
docker-compose logs banka-service | grep SignalR
```

**Bước 3: Restart bank services**
```bash
docker-compose restart banka-service bankb-service bankc-service
```

**Bước 4: Refresh trang**

Nhấn `Ctrl + F5` (Windows) hoặc `Cmd + Shift + R` (Mac) để hard refresh

---

### 8.8. Hệ thống chạy chậm

#### **Triệu chứng:**
- API response > 5 giây
- Dashboard load lâu
- Docker container CPU/RAM cao

#### **Giải pháp:**

**Bước 1: Kiểm tra tài nguyên**

```bash
docker stats
```

Xem container nào CPU/RAM cao

**Bước 2: Tăng tài nguyên cho Docker**

**Docker Desktop → Settings → Resources:**
- **CPU**: Tăng lên 4 cores
- **Memory**: Tăng lên 8GB

**Bước 3: Restart Docker Desktop**

**Bước 4: Restart containers**
```bash
docker-compose down
docker-compose up -d
```

---

### 8.9. Lỗi "Docker daemon not running"

#### **Triệu chứng:**
```
Cannot connect to Docker daemon
```

#### **Giải pháp:**

**Windows/macOS:**
1. Mở **Docker Desktop**
2. Chờ icon cá voi không còn nhấp nháy
3. Thử lại lệnh

**Linux:**
```bash
sudo systemctl start docker
sudo systemctl status docker
```

---

### 8.10. Reset toàn bộ hệ thống

Nếu mọi thứ rối loạn, bạn có thể reset hoàn toàn:

```bash
# Bước 1: Dừng tất cả containers
docker-compose down

# Bước 2: Xóa volumes (database data)
docker-compose down -v

# Bước 3: Xóa images (nếu muốn build lại hoàn toàn)
docker-compose down --rmi all

# Bước 4: Khởi động lại từ đầu
docker-compose up -d --build
```

⚠️ **Cảnh báo:** Lệnh này sẽ **XÓA TẤT CẢ DỮ LIỆU**!

---

## 9. DỪNG VÀ XÓA HỆ THỐNG

### 9.1. Dừng hệ thống (giữ dữ liệu)

Nếu bạn muốn **tạm dừng** hệ thống nhưng **giữ lại dữ liệu**:

```bash
docker-compose stop
```

Để khởi động lại:
```bash
docker-compose start
```

---

### 9.2. Dừng và xóa containers (giữ volumes)

Xóa containers nhưng **GIỮ LẠI DỮ LIỆU** trong databases:

```bash
docker-compose down
```

Lần sau chạy lại:
```bash
docker-compose up -d
```

Dữ liệu vẫn còn đó!

---

### 9.3. Xóa hoàn toàn (bao gồm dữ liệu)

⚠️ **CẢNH BÁO:** Lệnh này sẽ xóa **TẤT CẢ**:
- ❌ Containers
- ❌ Volumes (dữ liệu databases)
- ❌ Networks

```bash
docker-compose down -v
```

Nếu muốn xóa cả images:
```bash
docker-compose down -v --rmi all
```

---

### 9.4. Dọn dẹp Docker (tiết kiệm ổ cứng)

Sau nhiều lần build, Docker có thể chiếm nhiều dung lượng:

```bash
# Xem dung lượng Docker đang dùng
docker system df

# Xóa tất cả images, containers, volumes không dùng
docker system prune -a --volumes
```

⚠️ **Lưu ý:** Lệnh này sẽ xóa **TẤT CẢ** containers/images/volumes không chạy, không chỉ project này!

---

## 10. THAM KHẢO NHANH

### 10.1. Bảng Port Mapping

| Service | Internal Port | External Port | URL |
|---------|---------------|---------------|-----|
| API Gateway | 5000 | 5000 | http://localhost:5000 |
| Auth Service | 5001 | 5001 | http://localhost:5001 |
| NAPAS Service | 5002 | 5002 | http://localhost:5002 |
| Bank A Service | 5003 | 5003 | http://localhost:5003 |
| Bank B Service | 5004 | 5004 | http://localhost:5004 |
| Bank C Service | 5005 | 5005 | http://localhost:5005 |
| Auth Database | 5432 | 5432 | localhost:5432 |
| NAPAS Database | 5432 | 5433 | localhost:5433 |
| Bank A Database | 5432 | 5434 | localhost:5434 |
| Bank B Database | 5432 | 5435 | localhost:5435 |
| Bank C Database | 5432 | 5436 | localhost:5436 |
| RabbitMQ AMQP | 5672 | 5672 | - |
| RabbitMQ Management | 15672 | 15672 | http://localhost:15672 |
| Dashboard | 80 | 8080 | http://localhost:8080 |

---

### 10.2. Tài khoản Demo

| Username | Password | Bank | Accounts |
|----------|----------|------|----------|
| user_banka | pass123 | BANKA | BANKA001, BANKA002, BANKA003 |
| user_bankb | pass123 | BANKB | BANKB001, BANKB002, BANKB003 |
| user_bankc | pass123 | BANKC | BANKC001, BANKC002, BANKC003 |
| admin | admin123 | NAPAS | Admin access |

---

### 10.3. Lệnh Docker thường dùng

```bash
# Khởi động hệ thống
docker-compose up -d --build

# Xem trạng thái containers
docker-compose ps

# Xem logs
docker-compose logs -f

# Xem logs của service cụ thể
docker-compose logs -f banka-service

# Restart service cụ thể
docker-compose restart banka-service

# Dừng hệ thống
docker-compose stop

# Dừng và xóa containers
docker-compose down

# Dừng và xóa containers + volumes
docker-compose down -v

# Rebuild service cụ thể
docker-compose up -d --build banka-service

# Vào shell của container
docker-compose exec banka-service /bin/bash

# Xem tài nguyên sử dụng
docker stats
```

---

### 10.4. API Endpoints nhanh

#### **Auth Service (5001):**
```bash
# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user_banka","password":"pass123"}'

# Get users
curl http://localhost:5001/api/auth/users
```

#### **Bank Service (5003):**
```bash
# Get accounts
curl http://localhost:5003/api/accounts

# Internal transfer
curl -X POST http://localhost:5003/api/transfer/internal \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccountNumber": "BANKA001",
    "toAccountNumber": "BANKA002",
    "amount": 5000,
    "description": "Test transfer"
  }'

# Interbank transfer
curl -X POST http://localhost:5003/api/transfer/interbank \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccountNumber": "BANKA001",
    "toAccountNumber": "BANKB001",
    "toBankCode": "BANKB",
    "amount": 10000,
    "description": "Interbank test"
  }'
```

#### **NAPAS Service (5002):**
```bash
# Get all transactions
curl http://localhost:5002/api/transactions

# Get statistics
curl http://localhost:5002/api/statistics

# Get reconciliation records
curl http://localhost:5002/api/reconciliation
```

---

### 10.5. Troubleshooting Checklist

Khi gặp vấn đề, hãy kiểm tra theo thứ tự:

- [ ] Docker Desktop đang chạy?
- [ ] Tất cả containers đang "Up"? (`docker-compose ps`)
- [ ] Có lỗi trong logs? (`docker-compose logs -f`)
- [ ] Health endpoints trả về "Healthy"?
- [ ] RabbitMQ đang chạy? (http://localhost:15672)
- [ ] Database containers đang chạy?
- [ ] Port có bị chiếm dụng không?
- [ ] Đã thử restart services chưa?
- [ ] Đã thử xóa cache trình duyệt chưa?
- [ ] Đã thử reset toàn bộ hệ thống chưa? (`docker-compose down -v`)

---

## 11. KẾT LUẬN

### 11.1. Tóm tắt

Bạn đã học cách:

✅ Cài đặt Docker Desktop  
✅ Khởi động hệ thống microservices đầy đủ  
✅ Truy cập giao diện web  
✅ Thực hiện giao dịch nội bộ và liên ngân hàng  
✅ Xem lịch sử giao dịch  
✅ Giám sát hệ thống qua RabbitMQ Management  
✅ Xử lý các sự cố thường gặp  
✅ Dừng và xóa hệ thống  

### 11.2. Lưu ý quan trọng

⚠️ **Đây là hệ thống DEMO**, không sử dụng trong môi trường thực tế vì:
- Mật khẩu hardcode
- Không có encryption
- Không có rate limiting
- Chỉ dùng cho mục đích học tập

### 11.3. Tài liệu tham khảo

- **Docker Documentation**: https://docs.docker.com/
- **ASP.NET Core**: https://docs.microsoft.com/aspnet/core/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **RabbitMQ**: https://www.rabbitmq.com/documentation.html
- **SignalR**: https://docs.microsoft.com/aspnet/core/signalr/

### 11.4. Hỗ trợ

Nếu gặp vấn đề không giải quyết được, vui lòng:
1. Kiểm tra lại **Troubleshooting Checklist** (mục 10.5)
2. Xem logs chi tiết: `docker-compose logs -f`
3. Google lỗi cụ thể
4. Liên hệ người hướng dẫn

---


---

*Tài liệu này được viết cho dự án học tập "Hệ thống chuyển tiền liên ngân hàng qua NAPAS sử dụng kiến trúc Microservices"*

*Phiên bản: 1.0*  
*Ngày cập nhật: 28/12/2025*
