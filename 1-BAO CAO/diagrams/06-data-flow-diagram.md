# Data Flow & Microservices Interaction Diagram

```mermaid
flowchart TB
    subgraph "User Interface"
        USER[👤 User]
    end

    subgraph "Frontend Applications"
        FE_A[🏦 Bank A<br/>Frontend]
        FE_B[🏦 Bank B<br/>Frontend]
        FE_C[🏦 Bank C<br/>Frontend]
    end

    subgraph "API Gateway"
        GATEWAY[🚪 Ocelot<br/>API Gateway<br/>Port 5000]
    end

    subgraph "Authentication"
        AUTH_SVC[🔐 Auth Service<br/>Port 5001]
        AUTH_DB[(🗄️ Auth DB<br/>Users)]
    end

    subgraph "Bank A Microservice"
        BANKA_API[📡 Bank A API<br/>Port 5003]
        BANKA_CONSUMER[🔄 Transfer Consumer<br/>Background Service]
        BANKA_DB[(🗄️ Bank A DB<br/>Accounts<br/>Transactions)]
    end

    subgraph "Bank B Microservice"
        BANKB_API[📡 Bank B API<br/>Port 5004]
        BANKB_CONSUMER[🔄 Transfer Consumer<br/>Background Service]
        BANKB_DB[(🗄️ Bank B DB<br/>Accounts<br/>Transactions)]
    end

    subgraph "Bank C Microservice"
        BANKC_API[📡 Bank C API<br/>Port 5005]
        BANKC_CONSUMER[🔄 Transfer Consumer<br/>Background Service]
        BANKC_DB[(🗄️ Bank C DB<br/>Accounts<br/>Transactions)]
    end

    subgraph "NAPAS Core"
        NAPAS_API[📡 NAPAS API<br/>Port 5002]
        NAPAS_ROUTER[🔀 Transfer Router<br/>Background Service]
        NAPAS_PROCESSOR[⚙️ Result Processor<br/>Background Service]
        NAPAS_DB[(🗄️ NAPAS DB<br/>Transactions<br/>Reconciliation)]
    end

    subgraph "Message Queue Infrastructure"
        MQ[🐰 RabbitMQ<br/>Port 5672]
        Q1[📬 transfer_napas]
        Q2[📬 transfer_banka]
        Q3[📬 transfer_bankb]
        Q4[📬 transfer_bankc]
        Q5[📬 transfer_result]
    end

    %% User interactions
    USER -->|1. Access Web UI| FE_A
    USER -->|1. Access Web UI| FE_B
    USER -->|1. Access Web UI| FE_C

    %% Frontend to Gateway
    FE_A -->|2. HTTP REST| GATEWAY
    FE_B -->|2. HTTP REST| GATEWAY
    FE_C -->|2. HTTP REST| GATEWAY

    %% Gateway routing
    GATEWAY -->|3. Login| AUTH_SVC
    GATEWAY -->|3. Bank A APIs| BANKA_API
    GATEWAY -->|3. Bank B APIs| BANKB_API
    GATEWAY -->|3. Bank C APIs| BANKC_API
    GATEWAY -->|3. NAPAS APIs| NAPAS_API

    %% Auth Service
    AUTH_SVC <-->|4. User Validation| AUTH_DB
    AUTH_SVC -.->|5. JWT Token| GATEWAY

    %% Bank Services to DBs
    BANKA_API <-->|6a. CRUD Operations| BANKA_DB
    BANKB_API <-->|6b. CRUD Operations| BANKB_DB
    BANKC_API <-->|6c. CRUD Operations| BANKC_DB

    %% Internal Transfer (Direct)
    BANKA_DB -.->|7. Internal Transfer<br/>Instant Update| BANKA_DB

    %% Interbank Transfer Flow
    BANKA_API -->|8. Publish Transfer| Q1
    BANKB_API -->|8. Publish Transfer| Q1
    BANKC_API -->|8. Publish Transfer| Q1

    Q1 --> MQ
    MQ --> Q1

    Q1 -->|9. Consume| NAPAS_ROUTER
    NAPAS_ROUTER -->|10. Log Transaction| NAPAS_DB

    NAPAS_ROUTER -->|11. Route to Bank A| Q2
    NAPAS_ROUTER -->|11. Route to Bank B| Q3
    NAPAS_ROUTER -->|11. Route to Bank C| Q4

    Q2 --> MQ
    Q3 --> MQ
    Q4 --> MQ
    MQ --> Q2
    MQ --> Q3
    MQ --> Q4

    Q2 -->|12a. Consume| BANKA_CONSUMER
    Q3 -->|12b. Consume| BANKB_CONSUMER
    Q4 -->|12c. Consume| BANKC_CONSUMER

    BANKA_CONSUMER -->|13a. Credit Account| BANKA_DB
    BANKB_CONSUMER -->|13b. Credit Account| BANKB_DB
    BANKC_CONSUMER -->|13c. Credit Account| BANKC_DB

    BANKA_CONSUMER -->|14a. Publish Result| Q5
    BANKB_CONSUMER -->|14b. Publish Result| Q5
    BANKC_CONSUMER -->|14c. Publish Result| Q5

    Q5 --> MQ
    MQ --> Q5

    Q5 -->|15. Consume Result| NAPAS_PROCESSOR
    NAPAS_PROCESSOR -->|16. Update Status<br/>Create Reconciliation| NAPAS_DB

    %% NAPAS API queries
    NAPAS_API <-->|17. Statistics<br/>Reconciliation| NAPAS_DB

    style USER fill:#ffd700
    style GATEWAY fill:#ff6b6b
    style AUTH_SVC fill:#ff6b6b
    style NAPAS_API fill:#4ecdc4
    style NAPAS_ROUTER fill:#4ecdc4
    style NAPAS_PROCESSOR fill:#4ecdc4
    style BANKA_API fill:#667eea
    style BANKB_API fill:#11998e
    style BANKC_API fill:#f093fb
    style MQ fill:#ff9ff3
```

## Data Flow Scenarios

### Scenario 1: User Login
```
1. User opens Bank A frontend
2. Frontend → API Gateway → Auth Service
3. Auth Service validates credentials against Auth DB
4. Auth Service generates JWT token
5. Token returned to frontend
6. Frontend stores token for subsequent requests
```

### Scenario 2: View Account Balance
```
1. Frontend sends GET /api/accounts/BANKA001 (with JWT)
2. API Gateway routes to Bank A Service
3. Bank A Service queries Bank A Database
4. Account data returned through Gateway to Frontend
5. Frontend displays balance
```

### Scenario 3: Internal Transfer
```
1. Frontend sends POST /api/transfer/internal
2. API Gateway → Bank A Service
3. Bank A Service validates accounts and balance
4. Bank A Service updates both accounts in single transaction
5. Bank A Service saves transaction record (Status: SUCCESS)
6. Immediate response to user (< 100ms)
```

### Scenario 4: Interbank Transfer (Bank A → Bank B)
```
Step 1: Initiation (Bank A)
├── User submits transfer request
├── Bank A validates and deducts from sender
├── Bank A saves transaction (Status: PENDING)
└── Bank A publishes to transfer_napas queue

Step 2: Routing (NAPAS)
├── NAPAS Router consumes from transfer_napas
├── NAPAS logs transaction to NAPAS DB
├── NAPAS identifies destination bank (BANKB)
└── NAPAS publishes to transfer_bankb queue

Step 3: Processing (Bank B)
├── Bank B Consumer consumes from transfer_bankb
├── Bank B validates receiver account
├── Bank B credits receiver
├── Bank B saves transaction (Status: SUCCESS)
└── Bank B publishes result to transfer_result

Step 4: Reconciliation (NAPAS)
├── NAPAS Processor consumes from transfer_result
├── NAPAS updates transaction status
├── NAPAS creates reconciliation record
└── Transaction complete (Total: 2-3 seconds)
```

## Message Flow Patterns

### Pattern 1: Point-to-Point (Bank → NAPAS)
```
Publisher: Bank Service
Queue: transfer_napas
Consumer: NAPAS Router (single consumer)
Pattern: Work Queue
```

### Pattern 2: Routing (NAPAS → Specific Bank)
```
Publisher: NAPAS Router
Queue: transfer_banka / transfer_bankb / transfer_bankc
Consumer: Specific Bank Consumer
Pattern: Direct Exchange
```

### Pattern 3: Fanout (Result → NAPAS)
```
Publisher: Bank Services
Queue: transfer_result
Consumer: NAPAS Processor
Pattern: Work Queue with multiple publishers
```

## Data Consistency Models

### Strong Consistency (Internal Transfer)
- Single database transaction
- ACID properties guaranteed
- Immediate consistency
- Use case: Same-bank transfers

### Eventual Consistency (Interbank Transfer)
- Distributed transaction
- BASE properties (Basic Availability, Soft state, Eventual consistency)
- Asynchronous processing
- Use case: Cross-bank transfers

## Error Handling Flows

### Error Type 1: Validation Error
```
Request → Service validates → Returns 400 Bad Request
- No database changes
- Immediate response
- User corrects and retries
```

### Error Type 2: Insufficient Balance
```
Request → Service checks balance → Returns 400 Bad Request
- No database changes
- Immediate response
- User sees error message
```

### Error Type 3: Destination Account Not Found
```
Request → Bank A deducts → NAPAS routes → Bank B fails
- Bank A: Money deducted (PENDING)
- Bank B: Returns FAILED status
- NAPAS: Records failure
- Requires: Manual refund or auto-compensation
```

### Error Type 4: Service Unavailable
```
Request → Service down → Message queued
- RabbitMQ holds message
- Automatic retry when service recovers
- No message loss
```

## Performance Characteristics

| Operation | Latency | Consistency | Synchronous |
|-----------|---------|-------------|-------------|
| Login | 30-50ms | Strong | Yes |
| View Balance | 10-20ms | Strong | Yes |
| Internal Transfer | 50-100ms | Strong | Yes |
| Interbank Transfer (Initiate) | 100-200ms | Strong (sender) | Yes |
| Interbank Transfer (Complete) | 2-3 sec | Eventual | No |
| Transaction History | 20-50ms | Strong | Yes |
| Statistics | 50-100ms | Strong | Yes |

## Monitoring Points

### Application Metrics
- API request rate and latency
- Database query performance
- Message queue depth
- Consumer lag
- Error rates

### Infrastructure Metrics
- CPU and memory usage
- Network bandwidth
- Disk I/O
- Container health

### Business Metrics
- Total transactions
- Success rate
- Average transfer amount
- Peak usage times
- Daily/monthly volume

## Scalability Points

### Horizontal Scaling
- Add more service instances
- Load balance across instances
- Scale databases with read replicas

### Vertical Scaling
- Increase container resources
- Optimize database queries
- Add indexes

### Message Queue Scaling
- Add more consumers
- Partition queues
- Increase queue workers
