# System Architecture Overview - NAPAS 24/7 Fast Transfer Simulation

```mermaid
graph TB
    subgraph "Frontend Layer"
        FE_A[Bank A Frontend<br/>HTML + Bootstrap + JS<br/>Port: File System]
        FE_B[Bank B Frontend<br/>HTML + Bootstrap + JS<br/>Port: File System]
        FE_C[Bank C Frontend<br/>HTML + Bootstrap + JS<br/>Port: File System]
    end

    subgraph "API Gateway Layer"
        GW[API Gateway<br/>Ocelot<br/>Port: 5000]
    end

    subgraph "Service Layer - Authentication"
        AUTH[Auth Service<br/>.NET 8 Minimal API<br/>Port: 5001]
        DB_AUTH[(PostgreSQL<br/>authdb<br/>Port: 5432)]
    end

    subgraph "Service Layer - Banks"
        BANK_A[Bank A Service<br/>.NET 8 Minimal API<br/>+ Background Consumer<br/>Port: 5003]
        DB_A[(PostgreSQL<br/>bankadb<br/>Port: 5434)]

        BANK_B[Bank B Service<br/>.NET 8 Minimal API<br/>+ Background Consumer<br/>Port: 5004]
        DB_B[(PostgreSQL<br/>bankbdb<br/>Port: 5435)]

        BANK_C[Bank C Service<br/>.NET 8 Minimal API<br/>+ Background Consumer<br/>Port: 5005]
        DB_C[(PostgreSQL<br/>bankcdb<br/>Port: 5436)]
    end

    subgraph "Service Layer - NAPAS Core"
        NAPAS[NAPAS Service<br/>.NET 8 Minimal API<br/>+ Transfer Router<br/>+ Result Processor<br/>Port: 5002]
        DB_NAPAS[(PostgreSQL<br/>napasdb<br/>Port: 5433)]
    end

    subgraph "Message Broker Layer"
        MQ[RabbitMQ<br/>Message Broker<br/>Port: 5672, 15672]
        Q_NAPAS[Queue: transfer_napas]
        Q_BANKA[Queue: transfer_banka]
        Q_BANKB[Queue: transfer_bankb]
        Q_BANKC[Queue: transfer_bankc]
        Q_RESULT[Queue: transfer_result]
    end

    subgraph "Shared Library"
        SHARED[Shared.dll<br/>- TransferMessage<br/>- RabbitMqHelper<br/>- Common Models]
    end

    %% Frontend to Gateway
    FE_A -->|HTTP/REST| GW
    FE_B -->|HTTP/REST| GW
    FE_C -->|HTTP/REST| GW

    %% Gateway to Services
    GW -->|Route /auth/*| AUTH
    GW -->|Route /banka/*| BANK_A
    GW -->|Route /bankb/*| BANK_B
    GW -->|Route /bankc/*| BANK_C
    GW -->|Route /napas/*| NAPAS

    %% Services to Databases
    AUTH -->|EF Core| DB_AUTH
    BANK_A -->|EF Core| DB_A
    BANK_B -->|EF Core| DB_B
    BANK_C -->|EF Core| DB_C
    NAPAS -->|EF Core| DB_NAPAS

    %% Banks to RabbitMQ (Publish)
    BANK_A -->|Publish| Q_NAPAS
    BANK_B -->|Publish| Q_NAPAS
    BANK_C -->|Publish| Q_NAPAS

    %% NAPAS to RabbitMQ (Consume & Publish)
    Q_NAPAS -->|Consume| NAPAS
    NAPAS -->|Route & Publish| Q_BANKA
    NAPAS -->|Route & Publish| Q_BANKB
    NAPAS -->|Route & Publish| Q_BANKC

    %% Banks to RabbitMQ (Consume & Publish)
    Q_BANKA -->|Consume| BANK_A
    Q_BANKB -->|Consume| BANK_B
    Q_BANKC -->|Consume| BANK_C

    BANK_A -->|Publish Result| Q_RESULT
    BANK_B -->|Publish Result| Q_RESULT
    BANK_C -->|Publish Result| Q_RESULT

    Q_RESULT -->|Consume| NAPAS

    %% Shared Library Usage
    SHARED -.->|Referenced by| BANK_A
    SHARED -.->|Referenced by| BANK_B
    SHARED -.->|Referenced by| BANK_C
    SHARED -.->|Referenced by| NAPAS

    %% All in RabbitMQ
    MQ -->|Contains| Q_NAPAS
    MQ -->|Contains| Q_BANKA
    MQ -->|Contains| Q_BANKB
    MQ -->|Contains| Q_BANKC
    MQ -->|Contains| Q_RESULT

    style FE_A fill:#667eea
    style FE_B fill:#11998e
    style FE_C fill:#f093fb
    style GW fill:#ffd700
    style AUTH fill:#ff6b6b
    style NAPAS fill:#4ecdc4
    style BANK_A fill:#667eea
    style BANK_B fill:#11998e
    style BANK_C fill:#f093fb
    style MQ fill:#ff9ff3
    style SHARED fill:#95e1d3
```

## Architecture Layers

### 1. Frontend Layer
- **Technology**: HTML5 + Bootstrap 5 + Vanilla JavaScript
- **Pattern**: Single Page Application (SPA)
- **Communication**: REST API via Fetch
- **Features**: Login, Account View, Transfers, Transaction History

### 2. API Gateway Layer
- **Technology**: Ocelot (ASP.NET Core)
- **Purpose**: Single entry point, routing, CORS
- **Pattern**: Gateway Aggregation
- **Port**: 5000

### 3. Service Layer
- **Technology**: .NET 8 Minimal APIs
- **Pattern**: Microservices Architecture
- **Database**: Database per Service
- **Communication**:
  - Synchronous: HTTP/REST
  - Asynchronous: RabbitMQ

### 4. Message Broker Layer
- **Technology**: RabbitMQ
- **Pattern**: Message Queue, Publish-Subscribe
- **Queues**: 5 durable queues with persistent messages
- **Purpose**: Async, decoupled, reliable communication

### 5. Data Layer
- **Technology**: PostgreSQL 15
- **Pattern**: Database per Service
- **ORM**: Entity Framework Core 8
- **Migration**: Code-First with automatic migrations

## Key Design Patterns

### 1. Microservices Pattern
- Each service is independently deployable
- Each service has its own database
- Services communicate via API and message queue

### 2. Database per Service
- Data isolation and independence
- Each service owns its data
- No direct database access between services

### 3. Event-Driven Architecture
- Asynchronous communication via messages
- Loose coupling between services
- Eventual consistency

### 4. API Gateway Pattern
- Single entry point for clients
- Request routing and aggregation
- Cross-cutting concerns (CORS, auth)

### 5. Background Service Pattern
- Long-running hosted services
- Message queue consumers
- Async processing

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Backend | .NET | 8.0 | Microservices runtime |
| ORM | Entity Framework Core | 8.0 | Database abstraction |
| Database | PostgreSQL | 15 | Data persistence |
| Message Broker | RabbitMQ | 3.x | Async messaging |
| API Gateway | Ocelot | 23.4 | Request routing |
| Frontend | HTML/CSS/JS | - | User interface |
| UI Framework | Bootstrap | 5.3 | Responsive design |
| Container | Docker | - | Containerization |
| Orchestration | Docker Compose | - | Multi-container setup |

## Service Communication

### Synchronous (HTTP/REST)
- Frontend → API Gateway → Services
- Used for: Authentication, queries, internal transfers
- Response: Immediate (< 100ms)

### Asynchronous (RabbitMQ)
- Bank → NAPAS → Bank
- Used for: Interbank transfers
- Response: Eventual (2-3 seconds)

## Deployment Architecture

```
Docker Compose
├── 5 PostgreSQL containers
├── 1 RabbitMQ container
├── 6 .NET service containers
└── 1 Docker network (napas-network)
```

## Scalability Considerations

### Horizontal Scaling
- Multiple instances per service
- Load balancer in front of API Gateway
- Database read replicas

### Vertical Scaling
- Increase container resources
- Database optimization
- Connection pooling

### Message Queue Scaling
- RabbitMQ clustering
- Queue partitioning
- Consumer groups

## Security Architecture

### Current (Demo)
- Basic JWT authentication
- Plaintext passwords
- Open CORS policy
- HTTP only

### Production Required
- BCrypt password hashing
- HTTPS/TLS everywhere
- API rate limiting
- Input validation
- Secret management
- Database encryption
- Audit logging

## Monitoring & Observability

### Recommended Tools
- **Metrics**: Prometheus + Grafana
- **Logging**: Serilog + ELK Stack
- **Tracing**: OpenTelemetry + Jaeger
- **APM**: Application Insights
- **Alerts**: PagerDuty

## High Availability

### Database
- Master-slave replication
- Automatic failover
- Point-in-time recovery

### Services
- Multiple instances
- Health checks
- Circuit breakers
- Retry policies (Polly)

### Message Queue
- RabbitMQ clustering
- Persistent messages
- Dead letter queues
