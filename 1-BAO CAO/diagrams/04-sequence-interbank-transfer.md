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

## Timeline

| Step | Actor | Time | Description |
|------|-------|------|-------------|
| 1-8 | Bank A | ~100ms | Validate and deduct from sender |
| 9 | RabbitMQ | ~10ms | Message queued to NAPAS |
| 10 | API | instant | Response to user |
| 11-13 | NAPAS | ~50ms | Log and route transaction |
| 14 | RabbitMQ | ~10ms | Message queued to Bank B |
| 15-20 | Bank B | ~100ms | Credit receiver and save |
| 21 | RabbitMQ | ~10ms | Result queued |
| 22-24 | NAPAS | ~50ms | Update records and reconciliation |
| **Total** | | **~2-3 sec** | **End-to-end completion** |

## Key Points

1. **Immediate Deduction**: Sender's balance reduced immediately (prevents double-spending)
2. **Asynchronous Processing**: No blocking wait for destination bank
3. **Status Tracking**: PENDING → SUCCESS/FAILED
4. **Message Persistence**: RabbitMQ ensures no message loss
5. **Audit Trail**: Complete record in NAPAS for reconciliation
6. **Error Handling**: Failed transfers create error records
7. **Idempotency**: TransactionId ensures no duplicate processing

## Error Scenarios

### Scenario 1: Destination Account Not Found
- Bank B returns FAILED status
- Sender money already deducted
- Requires manual refund or automatic compensation

### Scenario 2: Bank B Service Down
- Message stays in 'transfer_bankb' queue
- Automatic retry when service recovers
- Message acknowledged only after successful processing

### Scenario 3: Network Failure
- RabbitMQ message persistence ensures no loss
- Unacknowledged messages redelivered
- Idempotent processing handles duplicates
