# Tổng Quan Kiến Trúc Hệ Thống - Mô Phỏng Chuyển Tiền Nhanh NAPAS 24/7

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

## Các tầng kiến trúc (Architecture Layers)

### 1. Tầng Frontend (Frontend Layer)
- **Công nghệ**: HTML5 + Bootstrap 5 + Vanilla JavaScript
- **Mẫu thiết kế (Pattern)**: Single Page Application (SPA)
- **Giao tiếp (Communication)**: REST API thông qua Fetch
- **Tính năng (Features)**: Đăng nhập, Xem tài khoản, Chuyển tiền, Lịch sử giao dịch

### 2. Tầng API Gateway (API Gateway Layer)
- **Công nghệ**: Ocelot (ASP.NET Core)
- **Mục đích (Purpose)**:  Điểm vào duy nhất, định tuyến (routing), CORS
- **Mẫu thiết kế**: Gateway Aggregation
- **Port**: 5000

### 3. Tầng Service (Service Layer)
- **Công nghệ**: .NET 8 Minimal APIs
- **Mẫu thiết kế**: Kiến trúc Microservices (Microservices Architecture)
- **Database**: Database per Service (Cơ sở dữ liệu riêng cho mỗi service)
- **Giao tiếp**:
  - Đồng bộ (Synchronous): HTTP/REST
  - Bất đồng bộ (Asynchronous): RabbitMQ

### 4. Tầng Message Broker (Message Broker Layer)
- **Công nghệ**: RabbitMQ
- **Mẫu thiết kế**: Message Queue, Publish-Subscribe
- **Queues**: 5 durable queues with persistent messages
- **Mục đích**: Giao tiếp async (bất đồng bộ), decoupled (tách biệt), đáng tin cậy (reliable)

### 5. Tầng Data (Data Layer)
- **Công nghệ**: PostgreSQL 15
- **Mẫu thiết kế**: Database per Service
- **ORM**: Entity Framework Core 8
- **Migration**: Code-First với automatic migrations (tự động migrate)

## Các mẫu thiết kế chính (Key Design Patterns)

### 1. Microservices Pattern
- Mỗi service có thể triển khai độc lập (independently deployable)
- Mỗi service sở hữu dữ liệu của riêng mình
- Các service giao tiếp qua API và message queue

### 2. Database per Service (Database riêng cho mỗi Service)
- Cô lập và độc lập dữ liệu (data isolation and independence)
- Each service owns its data
- Không truy cập trực tiếp database giữa các service

### 3. Event-Driven Architecture (Kiến trúc hướng sự kiện)
- Giao tiếp bất đồng bộ thông qua messages
- Loose coupling (liên kết lỏng lẻo) giữa các service
- Eventual consistency (tính nhất quán cuối cùng)

### 4. API Gateway Pattern
- Điểm vào duy nhất cho clients
- Định tuyến và tổng hợp request (request routing and aggregation)
- Xử lý các mối quan tâm chung (cross-cutting concerns): CORS, auth

### 5. Background Service Pattern
- Long-running hosted services
- Message queue consumers
- Xử lý bất đồng bộ (async processing)

## Technology Stack

| Tầng | Công nghệ | Phiên bản | Mục đích |
|-------|-----------|---------|---------|
| Backend | .NET | 8.0 | Microservices runtime |
| ORM | Entity Framework Core | 8.0 | Database abstraction (trừu tượng hóa DB) |
| Database | PostgreSQL | 15 | Data persistence (lưu trữ dữ liệu) |
| Message Broker | RabbitMQ | 3.x | Async messaging |
| API Gateway | Ocelot | 23.4 | Request routing (định tuyến request) |
| Frontend | HTML/CSS/JS | - | User interface |
| UI Framework | Bootstrap | 5.3 | Responsive design |
| Container | Docker | - | Containerization |
| Orchestration | Docker Compose | - | Multi-container setup |

## Giao tiếp giữa các Service (Service Communication)

### Đồng bộ (Synchronous - HTTP/REST)
- Frontend → API Gateway → Services
- Sử dụng cho: Authentication, queries (truy vấn), internal transfers
- Phản hồi (Response): Ngay lập tức (< 100ms)

### Bất đồng bộ (Asynchronous - RabbitMQ)
- Bank → NAPAS → Bank
- Sử dụng cho: Interbank transfers (chuyển tiền liên ngân hàng)
- Phản hồi: Cuối cùng (Eventual) (~2-3 giây)

## Kiến trúc triển khai (Deployment Architecture)

```
Docker Compose
├── 5 PostgreSQL containers
├── 1 RabbitMQ container
├── 6 .NET service containers
└── 1 Docker network (napas-network)
```

## Cân nhắc về khả năng mở rộng (Scalability Considerations)

### Mở rộng ngang (Horizontal Scaling)
- Nhiều instances cho mỗi service
- Load balancer đặt trước API Gateway
- Database read replicas (bản sao đọc)

### Mở rộng dọc (Vertical Scaling)
- Tăng tài nguyên container
- Tối ưu hóa database (database optimization)
- Connection pooling

### Mở rộng Message Queue (Message Queue Scaling)
- RabbitMQ clustering
- Queue partitioning (phân vùng queue)
- Consumer groups

## Kiến trúc bảo mật (Security Architecture)

### Hiện tại (Demo)
- JWT authentication cơ bản
- Mật khẩu plaintext (văn bản thuần)
- CORS policy mở
- Chỉ HTTP

### Yêu cầu cho Production (Production Required)
- BCrypt password hashing (mã hóa mật khẩu)
- HTTPS/TLS ở mọi nơi
- API rate limiting (giới hạn tốc độ)
- Input validation (xác thực đầu vào)
- Secret management (quản lý bí mật)
- Database encryption (mã hóa database)
- Audit logging (ghi log kiểm toán)

## Giám sát & Khả năng quan sát (Monitoring & Observability)

### Công cụ khuyến nghị (Recommended Tools)
- **Metrics (Số liệu)**: Prometheus + Grafana
- **Logging (Ghi log)**: Serilog + ELK Stack
- **Tracing (Truy vết)**: OpenTelemetry + Jaeger
- **APM (Application Performance Monitoring)**: Application Insights
- **Alerts (Cảnh báo)**: PagerDuty

## High Availability (Tính sẵn sàng cao)

### Database
- Master-slave replication (sao chép chủ-tớ)
- Automatic failover (chuyển đổi dự phòng tự động)
- Point-in-time recovery (khôi phục theo thời điểm)

### Services
- Multiple instances (nhiều instances)
- Health checks
- Circuit breakers (bộ ngắt mạch)
- Retry policies (chính sách thử lại) - Polly

### Message Queue
- RabbitMQ clustering
- Persistent messages (messages bền vững)
- Dead letter queues
