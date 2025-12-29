# HƯỚNG DẪN CÀI ĐẶT VÀ TRIỂN KHAI
## HỆ THỐNG CHUYỂN TIỀN LIÊN NGÂN HÀNG NAPAS

> **Mục đích:** Cài đặt và chạy hệ thống trên máy local  
> **Thời gian:** ~15-20 phút  
> **Hệ điều hành:** Windows/macOS/Linux

---

## 📋 MỤC LỤC

1. [Yêu Cầu Hệ Thống](#1-yêu-cầu-hệ-thống)
2. [Cài Đặt Công Cụ](#2-cài-đặt-công-cụ)
3. [Tải Source Code](#3-tải-source-code)
4. [Cấu Hình Environment](#4-cấu-hình-environment)
5. [Khởi Động Hệ Thống](#5-khởi-động-hệ-thống)
6. [Kiểm Tra Hệ Thống](#6-kiểm-tra-hệ-thống)
7. [Truy Cập Ứng Dụng](#7-truy-cập-ứng-dụng)
8. [Tài Khoản Demo](#8-tài-khoản-demo)
9. [Xử Lý Lỗi Thường Gặp](#9-xử-lý-lỗi-thường-gặp)
10. [Dừng Hệ Thống](#10-dừng-hệ-thống)

---

## 1. YÊU CẦU HỆ THỐNG

### **1.1. Phần Cứng Tối Thiểu:**

| Thành phần | Yêu cầu tối thiểu | Khuyến nghị |
|------------|-------------------|-------------|
| **CPU** | 2 cores | 4 cores |
| **RAM** | 8 GB | 16 GB |
| **Ổ cứng trống** | 10 GB | 20 GB |
| **Kết nối Internet** | Có (để tải Docker images) | Băng thông ổn định |

### **1.2. Hệ Điều Hành:**

- ✅ **Windows 10/11** (64-bit)
- ✅ **macOS** (10.15 Catalina trở lên)
- ✅ **Linux** (Ubuntu 20.04+, Debian, CentOS)

### **1.3. Phần Mềm Cần Thiết:**

| Công cụ | Phiên bản | Bắt buộc |
|---------|-----------|----------|
| **Docker Desktop** | 24.0+ | ✅ Bắt buộc |
| **Docker Compose** | 2.0+ | ✅ Bắt buộc (đi kèm Docker Desktop) |
| **Git** | 2.30+ | ✅ Bắt buộc |
| **Web Browser** | Chrome/Edge/Firefox | ✅ Bắt buộc |

**Lưu ý:** 
- Docker Desktop đã bao gồm Docker Compose
- Không cần cài đặt .NET SDK (đã có trong Docker containers)
- Không cần cài đặt PostgreSQL/RabbitMQ (chạy trong Docker)

---

## 2. CÀI ĐẶT CÔNG CỤ

### **2.1. Cài Đặt Docker Desktop**

#### **Windows:**

1. **Tải Docker Desktop:**
   - Truy cập: https://www.docker.com/products/docker-desktop/
   - Click "Download for Windows"
   - Chọn phiên bản phù hợp (WSL 2 backend khuyến nghị)

2. **Cài đặt:**
   ```
   - Chạy file Docker Desktop Installer.exe
   - Chọn "Use WSL 2 instead of Hyper-V" (nếu có)
   - Click "OK" → "Close and restart"
   ```

3. **Khởi động Docker Desktop:**
   ```
   - Tìm Docker Desktop trong Start Menu
   - Chạy ứng dụng
   - Chờ Docker Engine khởi động (icon Docker màu xanh ở system tray)
   ```

4. **Kiểm tra:**
   ```powershell
   docker --version
   # Output: Docker version 24.x.x, build ...
   
   docker-compose --version
   # Output: Docker Compose version v2.x.x
   ```

#### **macOS:**

1. **Tải Docker Desktop:**
   - Truy cập: https://www.docker.com/products/docker-desktop/
   - Chọn "Download for Mac"
   - Chọn chip phù hợp: Apple Silicon (M1/M2/M3) hoặc Intel

2. **Cài đặt:**
   ```
   - Mở file Docker.dmg
   - Kéo Docker icon vào Applications folder
   - Mở Docker từ Applications
   - Chấp nhận quyền truy cập nếu được hỏi
   ```

3. **Kiểm tra:**
   ```bash
   docker --version
   docker-compose --version
   ```

#### **Linux (Ubuntu/Debian):**

1. **Cài đặt Docker Engine:**
   ```bash
   # Update packages
   sudo apt-get update
   
   # Install prerequisites
   sudo apt-get install -y \
       apt-transport-https \
       ca-certificates \
       curl \
       gnupg \
       lsb-release
   
   # Add Docker's official GPG key
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
   
   # Set up stable repository
   echo \
     "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
     $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   
   # Install Docker Engine
   sudo apt-get update
   sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
   
   # Add user to docker group (để không cần sudo)
   sudo usermod -aG docker $USER
   
   # Log out và log in lại để áp dụng group changes
   ```

2. **Kiểm tra:**
   ```bash
   docker --version
   docker compose version
   ```

### **2.2. Cài Đặt Git**

#### **Windows:**

1. **Tải Git:**
   - Truy cập: https://git-scm.com/download/win
   - Tải phiên bản 64-bit

2. **Cài đặt:**
   ```
   - Chạy Git-xxx-64-bit.exe
   - Chọn "Use Git from Git Bash only" hoặc "Use Git from the Windows Command Prompt"
   - Các options khác để mặc định
   - Click "Next" → "Install"
   ```

3. **Kiểm tra:**
   ```powershell
   git --version
   # Output: git version 2.xx.x
   ```

#### **macOS:**

1. **Cài đặt qua Homebrew (khuyến nghị):**
   ```bash
   # Nếu chưa có Homebrew, cài đặt:
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # Cài đặt Git:
   brew install git
   ```

2. **Hoặc tải từ website:**
   - Truy cập: https://git-scm.com/download/mac
   - Tải và cài đặt

3. **Kiểm tra:**
   ```bash
   git --version
   ```

#### **Linux:**

```bash
# Ubuntu/Debian
sudo apt-get install -y git

# CentOS/RHEL
sudo yum install -y git

# Kiểm tra
git --version
```

---

## 3. TẢI SOURCE CODE

### **3.1. Clone Repository từ GitHub**

**Mở Terminal/Command Prompt/PowerShell:**

```bash
# Di chuyển đến thư mục muốn lưu project
cd ~  # hoặc cd C:\Users\YourName\ (Windows)

# Clone repository
git clone https://github.com/tungpv131086/napas-interbank-transfer-system.git

# Di chuyển vào thư mục project
cd napas-interbank-transfer-system
```

### **3.2. Kiểm Tra Cấu Trúc Thư Mục**

```bash
# Liệt kê các thư mục
ls -la  # macOS/Linux
dir     # Windows

# Kết quả mong đợi:
# 1-BAO CAO/
# 2- SOURCE CODE/
# 3- HUONG DAN/
# README.md
```

### **3.3. Di Chuyển vào Thư Mục Source Code**

```bash
cd "2- SOURCE CODE"
```

**Kiểm tra nội dung:**

```bash
ls -la  # hoặc dir (Windows)

# Kết quả:
# docker-compose.yml
# .env.example
# src/
# frontend/
# NapasSimulation.sln
# start.sh
```

---

## 4. CẤU HÌNH ENVIRONMENT

### **4.1. Tạo File .env**

**Hệ thống đã cung cấp file `.env.example` mẫu. Tạo file `.env` từ template:**

#### **macOS/Linux:**

```bash
cp .env.example .env
```

#### **Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
```

#### **Windows (Command Prompt):**

```cmd
copy .env.example .env
```

### **4.2. Nội Dung File .env Mặc Định**

**Mở file `.env` bằng text editor (Notepad, VS Code, nano, vim...):**

```env
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB_AUTH=authdb
POSTGRES_DB_NAPAS=napasdb
POSTGRES_DB_BANKA=bankadb
POSTGRES_DB_BANKB=bankbdb
POSTGRES_DB_BANKC=bankcdb

# RabbitMQ Configuration
RABBITMQ_DEFAULT_USER=guest
RABBITMQ_DEFAULT_PASS=guest
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672

# JWT Configuration
JWT_SECRET=YourSuperSecretKeyForJWTTokenGeneration12345
JWT_ISSUER=NapasSystem
JWT_AUDIENCE=NapasClients
JWT_EXPIRY_MINUTES=60

# API Ports
AUTH_SERVICE_PORT=5001
NAPAS_SERVICE_PORT=5002
BANKA_SERVICE_PORT=5003
BANKB_SERVICE_PORT=5004
BANKC_SERVICE_PORT=5005
API_GATEWAY_PORT=5000

# Frontend Port
FRONTEND_PORT=8080

# Database Ports (for external access)
POSTGRES_AUTH_PORT=5432
POSTGRES_NAPAS_PORT=5433
POSTGRES_BANKA_PORT=5434
POSTGRES_BANKB_PORT=5435
POSTGRES_BANKC_PORT=5436

# RabbitMQ Management Port
RABBITMQ_MANAGEMENT_PORT=15672
```

**Lưu ý:** 
- ✅ File `.env` này đã được cấu hình sẵn, **KHÔNG CẦN CHỈNH SỬA** để chạy demo
- ⚠️ Chỉ thay đổi nếu có xung đột port với ứng dụng khác đang chạy
- 🔒 Trong production, cần thay đổi `JWT_SECRET` và passwords

### **4.3. Kiểm Tra Ports Có Bị Chiếm Không**

**Các ports hệ thống sử dụng:**
- 5000-5005: API Services
- 5432-5436: PostgreSQL Databases
- 5672: RabbitMQ AMQP
- 8080: Frontend Dashboard
- 15672: RabbitMQ Management UI

**Kiểm tra ports:**

#### **Windows (PowerShell):**
```powershell
netstat -ano | findstr :8080
netstat -ano | findstr :5000
# Nếu không có output → Port trống, OK!
```

#### **macOS/Linux:**
```bash
lsof -i :8080
lsof -i :5000
# Nếu không có output → Port trống, OK!
```

**Nếu port bị chiếm:**
- Dừng ứng dụng đang chiếm port
- Hoặc thay đổi port trong file `.env`

---

## 5. KHỞI ĐỘNG HỆ THỐNG

### **5.1. Kiểm Tra Docker Đang Chạy**

```bash
docker info

# Nếu thấy thông tin Docker → OK
# Nếu lỗi "Cannot connect to the Docker daemon" → Khởi động Docker Desktop
```

### **5.2. Build và Khởi Động Containers**

**⚠️ LƯU Ý:** Lần đầu chạy sẽ mất **10-15 phút** để tải Docker images và build services.

```bash
# Đảm bảo đang ở thư mục "2- SOURCE CODE"
pwd  # hoặc cd (Windows) - Kiểm tra thư mục hiện tại

# Build và start tất cả services
docker-compose up -d --build
```

**Giải thích lệnh:**
- `docker-compose`: Công cụ orchestration
- `up`: Khởi động containers
- `-d`: Detached mode (chạy background)
- `--build`: Build lại images nếu có thay đổi

**Output mong đợi:**

```
[+] Building 234.5s (156/156) FINISHED
...
[+] Running 13/13
 ✔ Container postgres-auth          Started
 ✔ Container postgres-napas         Started
 ✔ Container postgres-banka         Started
 ✔ Container postgres-bankb         Started
 ✔ Container postgres-bankc         Started
 ✔ Container rabbitmq               Started
 ✔ Container auth-service           Started
 ✔ Container napas-service          Started
 ✔ Container banka-service          Started
 ✔ Container bankb-service          Started
 ✔ Container bankc-service          Started
 ✔ Container api-gateway            Started
 ✔ Container frontend-dashboard     Started
```

### **5.3. Xem Logs (Optional - Để Debug)**

**Xem logs tất cả services:**
```bash
docker-compose logs -f
```

**Xem logs một service cụ thể:**
```bash
docker-compose logs -f banka-service
docker-compose logs -f napas-service
```

**Dừng xem logs:** Press `Ctrl + C`

---

## 6. KIỂM TRA HỆ THỐNG

### **6.1. Kiểm Tra Containers Đang Chạy**

```bash
docker-compose ps
```

**Output mong đợi (13 containers):**

```
NAME                        STATUS
api-gateway                 Up 2 minutes
auth-service                Up 2 minutes
banka-service               Up 2 minutes
bankb-service               Up 2 minutes
bankc-service               Up 2 minutes
frontend-dashboard          Up 2 minutes
napas-service               Up 2 minutes
postgres-auth               Up 2 minutes (healthy)
postgres-banka              Up 2 minutes (healthy)
postgres-bankb              Up 2 minutes (healthy)
postgres-bankc              Up 2 minutes (healthy)
postgres-napas              Up 2 minutes (healthy)
rabbitmq                    Up 2 minutes (healthy)
```

**✅ Kiểm tra:**
- Tất cả containers có STATUS = "Up"
- PostgreSQL containers có "(healthy)"
- RabbitMQ có "(healthy)"

**❌ Nếu có container STATUS = "Exited" hoặc "Restarting":**
```bash
# Xem logs container bị lỗi
docker-compose logs tên-container

# Ví dụ:
docker-compose logs banka-service
```

### **6.2. Kiểm Tra Health Endpoints**

**Sử dụng curl hoặc trình duyệt:**

#### **Auth Service:**
```bash
curl http://localhost:5001/health
# Output: "Healthy" hoặc HTTP 200 OK
```

#### **NAPAS Service:**
```bash
curl http://localhost:5002/health
```

#### **Bank A Service:**
```bash
curl http://localhost:5003/health
```

#### **API Gateway:**
```bash
curl http://localhost:5000/health
```

**Hoặc mở trình duyệt:**
- http://localhost:5001/health
- http://localhost:5002/health
- http://localhost:5003/health

**Kết quả:** Nếu thấy "Healthy" hoặc JSON response → Service OK!

### **6.3. Kiểm Tra RabbitMQ Management**

**Truy cập:** http://localhost:15672

**Login:**
- Username: `guest`
- Password: `guest`

**Kiểm tra:**
- [ ] Login thành công
- [ ] Click tab "Queues" → Thấy 5 queues:
  - transfer_napas
  - transfer_banka
  - transfer_bankb
  - transfer_bankc
  - transfer_result
- [ ] Tất cả queues có State = "running"

### **6.4. Kiểm Tra Database Connections**

**Sử dụng psql (nếu đã cài PostgreSQL client):**

```bash
# Bank A Database
docker exec -it postgres-banka psql -U postgres -d bankadb -c "\dt"

# NAPAS Database
docker exec -it postgres-napas psql -U postgres -d napasdb -c "\dt"
```

**Output mong đợi:**
```
            List of relations
 Schema |     Name      | Type  |  Owner   
--------+---------------+-------+----------
 public | accounts      | table | postgres
 public | transactions  | table | postgres
```

**Hoặc dùng GUI tool (Optional):**
- **pgAdmin:** https://www.pgadmin.org/
- **DBeaver:** https://dbeaver.io/

**Connection info:**
- Host: `localhost`
- Port: `5434` (Bank A), `5433` (NAPAS)
- Username: `postgres`
- Password: `postgres`
- Database: `bankadb` (Bank A), `napasdb` (NAPAS)

---

## 7. TRUY CẬP ỨNG DỤNG

### **7.1. Multi-Bank Dashboard (Giao Diện Chính)**

**URL:** http://localhost:8080

**Giao diện:**
- 3 tabs: Bank A, Bank B, Bank C
- Login form
- Multi-language support (EN/VI)

**Screenshot:**
```
┌──────────────────────────────────────────────┐
│  NAPAS - Interbank Transfer System           │
│  ┌─────────┬─────────┬─────────┐            │
│  │ Bank A  │ Bank B  │ Bank C  │            │
│  └─────────┴─────────┴─────────┘            │
│                                              │
│  ┌──────────────────────────────┐           │
│  │  Username: [____________]    │           │
│  │  Password: [____________]    │           │
│  │          [  Login  ]         │           │
│  └──────────────────────────────┘           │
└──────────────────────────────────────────────┘
```

### **7.2. API Gateway**

**Base URL:** http://localhost:5000

**Swagger UI (API Documentation):** http://localhost:5000/swagger

**Available endpoints:**
- `POST /api/auth/login` - Login
- `GET /api/banka/accounts` - Get Bank A accounts
- `POST /api/banka/transfer` - Transfer from Bank A
- Similar endpoints for Bank B, Bank C
- `GET /api/napas/statistics` - NAPAS statistics

### **7.3. RabbitMQ Management UI**

**URL:** http://localhost:15672

**Credentials:**
- Username: `guest`
- Password: `guest`

**Tính năng:**
- View queues
- Monitor message rates
- Check connections
- View exchanges

---

## 8. TÀI KHOẢN DEMO

### **8.1. Tài Khoản Login**

Hệ thống đã tạo sẵn các tài khoản demo:

#### **Bank A:**
```
Username: user_banka
Password: pass123
```

**Accounts:**
- BANKA001: $100,000
- BANKA002: $50,000
- BANKA003: $75,000

#### **Bank B:**
```
Username: user_bankb
Password: pass123
```

**Accounts:**
- BANKB001: $100,000
- BANKB002: $60,000
- BANKB003: $80,000

#### **Bank C:**
```
Username: user_bankc
Password: pass123
```

**Accounts:**
- BANKC001: $100,000
- BANKC002: $70,000
- BANKC003: $90,000

### **8.2. Demo Giao Dịch Liên Ngân Hàng**

**Kịch bản test cơ bản:**

**Bước 1: Login Bank A**
1. Mở http://localhost:8080
2. Click tab "Bank A"
3. Login: `user_banka` / `pass123`
4. Click account: BANKA001

**Bước 2: Chuyển tiền đến Bank B**
1. Click button "Transfer"
2. Điền form:
   - Transfer Type: **Interbank (via NAPAS)**
   - Destination Bank: **Bank B**
   - To Account: `BANKB001`
   - Amount: `5000`
   - Description: "Demo chuyen tien lien ngan hang"
3. Click "Send Transfer"

**Bước 3: Kiểm tra kết quả**
- **Ngay lập tức:** Balance BANKA001 giảm $5,000 (status PENDING)
- **Sau 2-3 giây:** Transaction status chuyển SUCCESS

**Bước 4: Xác minh tại Bank B**
1. Logout Bank A
2. Click tab "Bank B"
3. Login: `user_bankb` / `pass123`
4. Click account: BANKB001
5. **Kiểm tra:** Balance đã tăng $5,000
6. **Kiểm tra:** Transaction History có giao dịch từ BANKA001

### **8.3. Demo SignalR Real-time**

**Mở 2 browser windows side-by-side:**

**Window 1:**
1. http://localhost:8080
2. Login Bank A: `user_banka` / `pass123`
3. Click BANKA001

**Window 2:**
1. http://localhost:8080 (new window)
2. Login Bank A: `user_banka` / `pass123`
3. Click BANKA002

**Test:**
1. **Window 1:** Transfer BANKA001 → BANKA002, $1,000
2. **Quan sát:**
   - Window 1: Balance giảm NGAY
   - Window 2: Balance tăng NGAY + Toast notification

**→ Real-time updates without refresh!**

---

## 9. XỬ LÝ LỖI THƯỜNG GẶP

### **9.1. Docker Daemon Not Running**

**Lỗi:**
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Giải pháp:**
1. Mở Docker Desktop
2. Chờ Docker Engine khởi động (icon xanh)
3. Chạy lại lệnh

---

### **9.2. Port Already in Use**

**Lỗi:**
```
Error starting userland proxy: listen tcp 0.0.0.0:8080: bind: address already in use
```

**Giải pháp:**

**Option 1: Dừng ứng dụng đang chiếm port**

Windows:
```powershell
# Tìm process ID
netstat -ano | findstr :8080
# Output: TCP 0.0.0.0:8080 ... LISTENING 12345

# Kill process
taskkill /PID 12345 /F
```

macOS/Linux:
```bash
# Tìm và kill process
lsof -ti:8080 | xargs kill -9
```

**Option 2: Thay đổi port trong .env**

Mở file `.env`, sửa:
```env
FRONTEND_PORT=8081  # Đổi từ 8080 sang 8081
```

Restart:
```bash
docker-compose down
docker-compose up -d
```

---

### **9.3. Container Exited/Unhealthy**

**Lỗi:**
```
banka-service    Exited (1)
```

**Kiểm tra logs:**
```bash
docker-compose logs banka-service
```

**Nguyên nhân thường gặp:**

**A. Database chưa sẵn sàng**
- Chờ 10-20 giây để PostgreSQL khởi động
- Restart container:
  ```bash
  docker-compose restart banka-service
  ```

**B. Lỗi connection string**
- Kiểm tra file `.env`
- Đảm bảo `POSTGRES_USER`, `POSTGRES_PASSWORD` đúng

**C. Port conflict**
- Kiểm tra logs: "Address already in use"
- Thay đổi port trong `.env`

---

### **9.4. RabbitMQ Not Starting**

**Lỗi:**
```
rabbitmq    Restarting (1)
```

**Giải pháp:**

1. **Xóa volume cũ:**
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

2. **Kiểm tra logs:**
   ```bash
   docker-compose logs rabbitmq
   ```

3. **Tăng memory limit (nếu máy yếu):**
   
   Mở `docker-compose.yml`, thêm vào service rabbitmq:
   ```yaml
   rabbitmq:
     ...
     deploy:
       resources:
         limits:
           memory: 1G
   ```

---

### **9.5. Database Migration Errors**

**Lỗi:**
```
Failed to migrate database: Table 'accounts' already exists
```

**Giải pháp:**

**Option 1: Reset databases (CHỈ cho development)**
```bash
docker-compose down -v  # Xóa volumes
docker-compose up -d    # Tạo lại
```

**Option 2: Manual migration**
```bash
# Connect to container
docker exec -it banka-service bash

# Run migrations
dotnet ef database update

# Exit
exit
```

---

### **9.6. Frontend 404 Not Found**

**Lỗi:** Truy cập http://localhost:8080 → 404

**Giải pháp:**

1. **Kiểm tra container:**
   ```bash
   docker-compose ps frontend-dashboard
   # Status phải là "Up"
   ```

2. **Kiểm tra nginx config:**
   ```bash
   docker-compose logs frontend-dashboard
   # Tìm lỗi trong logs
   ```

3. **Restart frontend:**
   ```bash
   docker-compose restart frontend-dashboard
   ```

---

### **9.7. SignalR Connection Failed**

**Lỗi:** DevTools console:
```
Failed to connect to SignalR hub
```

**Giải pháp:**

1. **Kiểm tra Bank service đang chạy:**
   ```bash
   docker-compose ps banka-service
   ```

2. **Kiểm tra WebSocket support:**
   - Mở DevTools (F12) → Network → WS
   - Refresh page
   - Kiểm tra `balanceHub` connection

3. **Restart bank service:**
   ```bash
   docker-compose restart banka-service
   ```

---

### **9.8. Slow Performance**

**Triệu chứng:** Giao dịch mất > 10 giây

**Nguyên nhân:** Máy yếu, Docker thiếu resources

**Giải pháp:**

1. **Tăng Docker resources:**
   - Mở Docker Desktop → Settings → Resources
   - Tăng CPU: 4 cores
   - Tăng Memory: 8 GB

2. **Giảm số services chạy:**
   ```bash
   # Chỉ chạy Bank A và NAPAS
   docker-compose up -d postgres-banka banka-service postgres-napas napas-service rabbitmq api-gateway frontend-dashboard
   ```

3. **Disable logs:**
   ```bash
   docker-compose up -d --no-log-prefix
   ```

---

## 10. DỪNG HỆ THỐNG

### **10.1. Dừng Tạm Thời (Giữ Dữ Liệu)**

```bash
docker-compose stop
```

**Khởi động lại:**
```bash
docker-compose start
```

### **10.2. Dừng và Xóa Containers (Giữ Volumes)**

```bash
docker-compose down
```

**Khởi động lại:**
```bash
docker-compose up -d
```

**Dữ liệu:** Database data vẫn còn trong volumes

### **10.3. Dừng và Xóa Tất Cả (Bao Gồm Volumes)**

```bash
docker-compose down -v
```

**Cảnh báo:** Xóa hết data, cần chạy lại từ đầu

**Khởi động lại:**
```bash
docker-compose up -d --build
```

### **10.4. Xóa Images (Giải Phóng Ổ Đĩa)**

```bash
# Xem images
docker images | grep napas

# Xóa tất cả images của project
docker-compose down --rmi all -v
```

---

## 📊 THỐNG KÊ HỆ THỐNG

**Sau khi khởi động thành công:**

### **Containers (13):**
- 6 Services (.NET): auth, napas, banka, bankb, bankc, api-gateway
- 5 Databases (PostgreSQL): auth-db, napas-db, banka-db, bankb-db, bankc-db
- 1 Message Queue (RabbitMQ)
- 1 Frontend (Nginx)

### **Ports Exposed:**
| Service | Port | URL |
|---------|------|-----|
| Frontend Dashboard | 8080 | http://localhost:8080 |
| API Gateway | 5000 | http://localhost:5000 |
| Auth Service | 5001 | http://localhost:5001 |
| NAPAS Service | 5002 | http://localhost:5002 |
| Bank A Service | 5003 | http://localhost:5003 |
| Bank B Service | 5004 | http://localhost:5004 |
| Bank C Service | 5005 | http://localhost:5005 |
| RabbitMQ Management | 15672 | http://localhost:15672 |
| PostgreSQL Auth | 5432 | localhost:5432 |
| PostgreSQL NAPAS | 5433 | localhost:5433 |
| PostgreSQL Bank A | 5434 | localhost:5434 |
| PostgreSQL Bank B | 5435 | localhost:5435 |
| PostgreSQL Bank C | 5436 | localhost:5436 |

### **Volumes (5):**
- postgres-auth-data
- postgres-napas-data
- postgres-banka-data
- postgres-bankb-data
- postgres-bankc-data

### **Networks (1):**
- napas-network (bridge)

### **Resource Usage (Typical):**
- CPU: 10-20%
- RAM: 4-6 GB
- Disk: ~8 GB (images + volumes)

---

## ✅ CHECKLIST HOÀN THÀNH

**Sau khi làm theo hướng dẫn, kiểm tra:**

- [ ] Docker Desktop đã cài đặt và chạy
- [ ] Git đã cài đặt
- [ ] Source code đã clone từ GitHub
- [ ] File `.env` đã tạo
- [ ] `docker-compose up -d --build` chạy thành công
- [ ] `docker-compose ps` hiển thị 13 containers "Up"
- [ ] Truy cập http://localhost:8080 thành công
- [ ] Login Bank A thành công
- [ ] Chuyển tiền liên ngân hàng thành công
- [ ] RabbitMQ Management UI truy cập được
- [ ] SignalR real-time hoạt động

**Nếu tất cả ✅ → Hệ thống sẵn sàng!**

---

## 📞 HỖ TRỢ

### **Nếu gặp vấn đề:**

1. **Kiểm tra logs:**
   ```bash
   docker-compose logs -f [tên-service]
   ```

2. **Restart hệ thống:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. **Reset hoàn toàn:**
   ```bash
   docker-compose down -v
   docker-compose up -d --build
   ```

4. **Liên hệ nhóm:**
   - GitHub Issues: https://github.com/tungpv131086/napas-interbank-transfer-system/issues
   - Email: tungpv131086@gmail.com

---

## 📚 TÀI LIỆU THAM KHẢO

### **Docker:**
- Docker Documentation: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/

### **Công Nghệ Sử Dụng:**
- .NET 8.0: https://dotnet.microsoft.com/
- PostgreSQL: https://www.postgresql.org/docs/
- RabbitMQ: https://www.rabbitmq.com/documentation.html
- SignalR: https://learn.microsoft.com/en-us/aspnet/core/signalr/

### **Tài Liệu Dự Án:**
- README.md: Tổng quan hệ thống
- KIEN_TRUC_HE_THONG.md: Kiến trúc chi tiết
- KICH_BAN_DEMO.md: Kịch bản demo

---

## 🎓 KẾT LUẬN

Hệ thống NAPAS Interbank Transfer đã được containerize hoàn toàn, dễ dàng cài đặt và chạy trên bất kỳ máy nào có Docker.

**Ưu điểm:**
- ✅ Không cần cài .NET SDK, PostgreSQL, RabbitMQ
- ✅ Một lệnh khởi động toàn bộ hệ thống
- ✅ Isolated environment, không ảnh hưởng máy host
- ✅ Dễ dàng reset về trạng thái ban đầu

**Thời gian setup:** ~15-20 phút (bao gồm tải images lần đầu)


---

**Ngày cập nhật:** 29/12/2025  
**Phiên bản:** 1.0  
**Nhóm thực hiện:** Nhóm 2 - Lớp M25CQHT01-B
