# ERD - Auth Service

```mermaid
erDiagram
    USERS {
        int Id PK
        varchar Username UK "NOT NULL, UNIQUE"
        varchar Password "NOT NULL (plaintext for demo)"
        varchar BankCode "NOT NULL"
        varchar Role "NOT NULL (User/Admin)"
    }

    USERS ||--o{ BANKS : "belongs_to"

    BANKS {
        varchar BankCode PK
        varchar BankName
    }
```

## Table: Users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| Username | VARCHAR(100) | NOT NULL, UNIQUE | Login username |
| Password | VARCHAR(100) | NOT NULL | Password (plaintext in demo) |
| BankCode | VARCHAR(10) | NOT NULL | Associated bank code |
| Role | VARCHAR(50) | NOT NULL | User role (User/Admin) |

## Seed Data

```sql
INSERT INTO Users (Id, Username, Password, BankCode, Role) VALUES
(1, 'user_banka', 'pass123', 'BANKA', 'User'),
(2, 'user_bankb', 'pass123', 'BANKB', 'User'),
(3, 'user_bankc', 'pass123', 'BANKC', 'User'),
(4, 'admin', 'admin123', 'NAPAS', 'Admin');
```

## Notes

- **Security**: In production, passwords should be hashed using BCrypt or similar
- **JWT**: Tokens include Username, BankCode, and Role claims
- **Relationships**: Users belong to a bank via BankCode
