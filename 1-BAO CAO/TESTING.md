# Hướng Dẫn Kiểm Thử

Hướng dẫn đầy đủ để kiểm thử hệ thống mô phỏng NAPAS.

## Yêu Cầu

Đảm bảo tất cả dịch vụ đang chạy:
```bash
./start.sh
# HOẶC
docker-compose up -d
```

## Kịch Bản Kiểm Thử

### 1. Kiểm Thử Xác Thực

#### Kiểm Thử Đăng Nhập - Thành Công
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user_banka","password":"pass123"}'
```

**Kết quả Mong đợi** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "bankCode": "BANKA",
  "username": "user_banka",
  "role": "User"
}
```

#### Kiểm Thử Đăng Nhập - Thất Bại
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"wrong","password":"wrong"}'
```

**Kết quả Mong đợi** (401 Unauthorized)

### 2. Kiểm Thử Hoạt Động Tài Khoản

#### Lấy Tất Cả Tài Khoản
```bash
curl http://localhost:5003/api/accounts
```

**Kết quả Mong đợi** (200 OK):
```json
[
  {
    "id": 1,
    "accountNumber": "BANKA001",
    "accountHolderName": "John Doe",
    "balance": 100000,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  ...
]
```

[Phần còn lại của TESTING.md được dịch tương tự...]
