# Sequence Diagram - Interbank Transfer (24/7 Fast Transfer via NAPAS)

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Bank A)
    participant FE as Bank A Frontend
    participant API as Bank A Service
    participant DB_A as Bank A Database
    participant MQ as RabbitMQ
    participant NAPAS as NAPAS Service
    participant DB_N as NAPAS Database
    participant API_B as Bank B Service
    participant DB_B as Bank B Database

    %% User initiates transfer
    User->>FE: Initiate interbank transfer<br/>(To: BANKB001, Amount: $5000)
    FE->>API: POST /api/transfer/interbank<br/>FromAccount: BANKA001<br/>ToAccount: BANKB001<br/>ToBankCode: BANKB

    %% Bank A processing
    Note over API,DB_A: Source Bank Processing
    API->>DB_A: BEGIN TRANSACTION
    API->>DB_A: Validate account exists
    DB_A-->>API: Account found
    API->>DB_A: Check balance >= $5000
    DB_A-->>API: Sufficient balance
    API->>DB_A: Deduct $5000 from BANKA001
    API->>DB_A: INSERT Transaction<br/>(Status: PENDING, Type: INTERBANK)
    API->>DB_A: COMMIT TRANSACTION
    DB_A-->>API: Transaction saved

    %% Publish to NAPAS
    Note over API,MQ: Async Message to NAPAS
    API->>MQ: Publish to 'transfer_napas' queue<br/>TransferMessage {<br/>  TransactionId: "guid",<br/>  FromBank: BANKA,<br/>  ToBank: BANKB,<br/>  Amount: $5000<br/>}
    API-->>FE: 200 OK<br/>{message: "Transfer request sent to NAPAS",<br/>transactionId: "guid"}
    FE-->>User: ✅ Transfer initiated (PENDING)

    %% NAPAS receives and routes
    Note over MQ,NAPAS: NAPAS Routing
    MQ->>NAPAS: Consume from 'transfer_napas'<br/>TransferMessage
    NAPAS->>DB_N: INSERT NapasTransaction<br/>(Status: PENDING)
    DB_N-->>NAPAS: Transaction logged
    NAPAS->>MQ: Publish to 'transfer_bankb' queue<br/>TransferMessage (same data)

    %% Bank B processes
    Note over API_B,DB_B: Destination Bank Processing
    MQ->>API_B: Consume from 'transfer_bankb'<br/>TransferMessage
    API_B->>DB_B: BEGIN TRANSACTION
    API_B->>DB_B: Validate account BANKB001 exists

    alt Account exists
        DB_B-->>API_B: Account found
        API_B->>DB_B: Credit $5000 to BANKB001
        API_B->>DB_B: INSERT Transaction<br/>(Status: SUCCESS, Type: INTERBANK)
        API_B->>DB_B: COMMIT TRANSACTION
        DB_B-->>API_B: Transaction completed
        Note over API_B: Status = SUCCESS
    else Account not found
        DB_B-->>API_B: Account not found
        API_B->>DB_B: ROLLBACK
        Note over API_B: Status = FAILED<br/>Error: Account not found
    end

    %% Bank B sends result
    Note over API_B,MQ: Result Notification
    API_B->>MQ: Publish to 'transfer_result' queue<br/>TransferMessage {<br/>  TransactionId: "guid",<br/>  Status: SUCCESS/FAILED,<br/>  ErrorMessage: null/error<br/>}

    %% NAPAS updates records
    Note over NAPAS,DB_N: NAPAS Reconciliation
    MQ->>NAPAS: Consume from 'transfer_result'<br/>TransferMessage
    NAPAS->>DB_N: UPDATE NapasTransaction<br/>SET Status = SUCCESS/FAILED,<br/>CompletedAt = NOW()
    NAPAS->>DB_N: INSERT ReconciliationRecord<br/>(For settlement)
    DB_N-->>NAPAS: Records updated

    %% User checks status
    Note over User,FE: User Verification (3 seconds later)
    User->>FE: Refresh transaction history
    FE->>API: GET /api/accounts/BANKA001/transactions
    API->>DB_A: SELECT * FROM Transactions<br/>WHERE FromAccountNumber = 'BANKA001'
    DB_A-->>API: Transaction list
    API-->>FE: JSON response
    FE-->>User: ✅ Transfer SUCCESS<br/>Balance: $95,000

    Note over User,DB_B: Complete: $5000 transferred<br/>from Bank A to Bank B via NAPAS
```

## Timeline (Tiến trình thời gian)

| Bước | Actor | Thời gian | Mô tả |
|------|-------|------|-------------|
| 1-8 | 🏦 Bank A | ~100ms | Xác thực và trừ tiền từ người gửi |
| 9 | 📬 RabbitMQ| ~10ms | Message được đưa vào hàng đợi tới NAPAS |
| 10 | 🚀 API | instant | Phản hồi cho người dùng |
| 11-13 | 🏢 NAPAS | ~50ms | Ghi log và định tuyến giao dịch |
| 14 | 📬 RabbitMQ | ~10ms | Message được đưa vào hàng đợi tới Bank B |
| 15-20 | 🏦 Bank B| ~100ms | Cộng tiền cho người nhận và lưu |
| 21 | 📬 RabbitMQ | ~10ms | Kết quả được đưa vào hàng đợi |
| 22-24 | 🏢 NAPAS | ~50ms | Cập nhật records và reconciliation |
| **⚡ Tổng** | | **~2-3 sec** | **Hoàn thành toàn bộ quá trình** |

## Các điểm chính (Key Points)

1. **Trừ tiền ngay lập tức (Immediate Deduction)**: Số dư người gửi được trừ ngay (ngăn chặn chi tiêu hai lần - prevents double-spending)
2. **Xử lý bất đồng bộ (Asynchronous Processing)**: Không chờ đợi (blocking wait) ngân hàng đích
3. **Theo dõi trạng thái (Status Tracking)**: PENDING → SUCCESS/FAILED
4. **Lưu trữ Message bền vững (Message Persistence)**: RabbitMQ đảm bảo không mất message
5. **Nhật ký kiểm toán (Audit Trail)**: Ghi nhận đầy đủ tại NAPAS để phục vụ reconciliation (đối soát)
6. **Xử lý lỗi (Error Handling)**: Giao dịch thất bại tạo ra error records
7. **Tính bất biến (Idempotency)**: TransactionId đảm bảo không xử lý trùng lặp

## Các kịch bản lỗi(Error Scenarios)

### Kịch bản 1: Tài khoản đích không tồn tại (Destination Account Not Found)
- Bank B trả về status FAILED
- Tiền người gửi đã bị trừ
- Yêu cầu hoàn tiền thủ công hoặc bồi thường tự động (automatic compensation)

### Kịch bản 2: Service Bank B bị down
- Message vẫn nằm trong queue 'transfer_bankb'
- Tự động retry (thử lại) khi service phục hồi
- Message chỉ được acknowledged (xác nhận) sau khi xử lý thành công

### Kịch bản 3: Lỗi mạng (Network Failure)
- RabbitMQ message persistence đảm bảo không mất dữ liệu
- Các message chưa được acknowledged sẽ được gửi lại (redelivered)
- Xử lý idempotent (bất biến) xử lý các duplicate (trùng lặp)
