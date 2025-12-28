# ERD - Bank Service (A, B, C)

```mermaid
erDiagram
    ACCOUNTS {
        int Id PK
        varchar AccountNumber UK "UNIQUE, NOT NULL"
        varchar AccountHolderName "NOT NULL"
        decimal Balance "NOT NULL"
        timestamp CreatedAt "NOT NULL"
    }

    TRANSACTIONS {
        int Id PK
        varchar TransactionId UK "GUID, UNIQUE"
        varchar FromAccountNumber FK "NOT NULL"
        varchar ToAccountNumber "NOT NULL"
        varchar ToBankCode "NULL for internal"
        decimal Amount "NOT NULL"
        text Description
        varchar Type "INTERNAL/INTERBANK"
        varchar Status "PENDING/SUCCESS/FAILED"
        timestamp CreatedAt "NOT NULL"
        timestamp CompletedAt "NULL"
    }

    ACCOUNTS ||--o{ TRANSACTIONS : "from_account"
    ACCOUNTS ||--o{ TRANSACTIONS : "to_account"
```

## Table: Accounts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | INT | PRIMARY KEY, AUTO_INCREMENT | Internal account ID |
| AccountNumber | VARCHAR(50) | NOT NULL, UNIQUE | Unique account identifier |
| AccountHolderName | VARCHAR(200) | NOT NULL | Customer name |
| Balance | DECIMAL(18,2) | NOT NULL | Current balance |
| CreatedAt | TIMESTAMP | NOT NULL | Account creation date |

## Table: Transactions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | INT | PRIMARY KEY, AUTO_INCREMENT | Transaction record ID |
| TransactionId | VARCHAR(100) | NOT NULL, UNIQUE | Global transaction ID (GUID) |
| FromAccountNumber | VARCHAR(50) | NOT NULL | Sender account |
| ToAccountNumber | VARCHAR(50) | NOT NULL | Receiver account |
| ToBankCode | VARCHAR(10) | NULL | Destination bank (NULL for internal) |
| Amount | DECIMAL(18,2) | NOT NULL | Transfer amount |
| Description | TEXT | NULL | Transfer description |
| Type | VARCHAR(20) | NOT NULL | INTERNAL or INTERBANK |
| Status | VARCHAR(20) | NOT NULL | PENDING/SUCCESS/FAILED |
| CreatedAt | TIMESTAMP | NOT NULL | Transaction start time |
| CompletedAt | TIMESTAMP | NULL | Transaction completion time |

## Seed Data - Bank A

```sql
INSERT INTO Accounts (Id, AccountNumber, AccountHolderName, Balance, CreatedAt) VALUES
(1, 'BANKA001', 'John Doe', 100000.00, NOW()),
(2, 'BANKA002', 'Jane Smith', 50000.00, NOW()),
(3, 'BANKA003', 'Bob Johnson', 75000.00, NOW());
```

## Seed Data - Bank B

```sql
INSERT INTO Accounts (Id, AccountNumber, AccountHolderName, Balance, CreatedAt) VALUES
(1, 'BANKB001', 'Alice Williams', 100000.00, NOW()),
(2, 'BANKB002', 'Charlie Brown', 50000.00, NOW()),
(3, 'BANKB003', 'Diana Prince', 75000.00, NOW());
```

## Seed Data - Bank C

```sql
INSERT INTO Accounts (Id, AccountNumber, AccountHolderName, Balance, CreatedAt) VALUES
(1, 'BANKC001', 'Eve Anderson', 100000.00, NOW()),
(2, 'BANKC002', 'Frank Miller', 50000.00, NOW()),
(3, 'BANKC003', 'Grace Lee', 75000.00, NOW());
```

## Indexes

```sql
CREATE UNIQUE INDEX idx_account_number ON ACCOUNTS(AccountNumber);
CREATE UNIQUE INDEX idx_transaction_id ON TRANSACTIONS(TransactionId);
CREATE INDEX idx_from_account ON TRANSACTIONS(FromAccountNumber);
CREATE INDEX idx_to_account ON TRANSACTIONS(ToAccountNumber);
CREATE INDEX idx_created_at ON TRANSACTIONS(CreatedAt);
CREATE INDEX idx_status ON TRANSACTIONS(Status);
```

## Business Rules

1. **Internal Transfer**:
   - Both accounts in same bank
   - ToBankCode is NULL
   - Type = "INTERNAL"
   - Status immediately set to SUCCESS
   - Balance updated in single transaction

2. **Interbank Transfer**:
   - Accounts in different banks
   - ToBankCode is populated
   - Type = "INTERBANK"
   - Initial Status = PENDING
   - Sender balance deducted immediately
   - Receiver balance credited asynchronously
   - Status updated upon completion

3. **Constraints**:
   - Balance cannot be negative
   - Amount must be positive
   - FromAccount and ToAccount must exist
   - Sufficient balance required before transfer
