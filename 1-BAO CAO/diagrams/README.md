# NAPAS Simulation - Architecture Diagrams

Thư mục này chứa các sơ đồ Mermaid toàn diện cho Hệ thống Chuyển Tiền Nhanh Liên Ngân Hàng NAPAS 24/7.

## 📊 Danh Mục Sơ Đồ (Diagram Index)

### 1. Sơ Đồ Quan Hệ Thực Thể (Entity Relationship Diagrams - ERDs)

#### [01-erd-auth-service.md](01-erd-auth-service.md)
**Auth Service Database Schema**
- Bảng Users với thông tin đăng nhập
- Liên kết mã ngân hàng (bank code associations)
- Phân quyền theo vai trò (role-based access)
- Dữ liệu mẫu (seed data) cho users demo

#### [02-erd-napas-service.md](02-erd-napas-service.md)
**NAPAS Service Database Schema**
- NapasTransactions: Bản ghi giao dịch liên ngân hàng đầy đủ
- ReconciliationRecords: Bù trừ thanh toán và audit trail
- Quy tắc nghiệp vụ và ràng buộc (constraints)

#### [03-erd-bank-service.md](03-erd-bank-service.md)
**Bank Service Database Schema (A, B, C)**
- Accounts: Tài khoản khách hàng với số dư
- Transactions: Chuyển tiền nội bộ và liên ngân hàng
- Dữ liệu mẫu cho cả ba ngân hàng
- Business rules and constraints

### 2. Sơ Đồ Quy Trình (Process Diagrams)

#### [04-sequence-interbank-transfer.md](04-sequence-interbank-transfer.md)
**Sequence Diagram Chuyển Tiền Liên Ngân Hàng**
- Luồng chi tiết từng bước từ người gửi đến người nhận
- Hiển thị tất cả tương tác giữa các microservices
- Giao tiếp message queue
- Các thao tác database
- Các kịch bản xử lý lỗi
- Timeline với các chỉ số hiệu năng

### 3. Sơ Đồ Kiến Trúc (Architecture Diagrams)

#### [05-architecture-overview.md](05-architecture-overview.md)
**Tổng Quan Kiến Trúc Hệ Thống Cấp Cao**
- Tất cả microservices và quan hệ của chúng
- Mẫu Database per Service
- Hạ tầng Message broker
- Định tuyến API Gateway
- Các ứng dụng Frontend
- Technology stack
- Cân nhắc về khả năng mở rộng (scalability)

#### [06-data-flow-diagram.md](06-data-flow-diagram.md)
**Luồng Dữ Liệu & Tương Tác Microservices**
- Luồng dữ liệu hoàn chỉnh qua hệ thống
- Các mẫu message queue patterns
- Luồng đồng bộ vs bất đồng bộ (synchronous vs asynchronous)
- Luồng xử lý lỗi
- Đặc tính hiệu năng
- Mô hình nhất quán (consistency models)

## 🎯 Cách Sử Dụng Các Sơ Đồ Này

### Xem Sơ Đồ (Viewing Diagrams)

Tất cả sơ đồ sử dụng cú pháp Mermaid và có thể xem trên:

1. **GitHub**: Tự động render khi xem files .md
2. **VS Code**: Cài extension "Markdown Preview Mermaid Support"
3. **Online**: Copy code vào https://mermaid.live
4. **Documentation Tools**: Hầu hết đều hỗ trợ Mermaid (GitBook, Docusaurus, etc.)

### Cho Bài Thuyết Trình (For Presentations)

1. **Screenshot**: Chụp từ GitHub hoặc Mermaid Live
2. **Export**: Dùng Mermaid Live xuất PNG/SVG
3. **Live Demo**: Hiển thị trực tiếp trong VS Code hoặc GitHub
4. **PowerPoint**: Copy ảnh đã export vào slides

### Cho Luận Văn/Đồ Án (For Thesis/Capstone)

Đưa các sơ đồ này vào tài liệu:

#### Chapter 3: Thiết Kế Hệ Thống
- Tổng quan Kiến trúc (Diagram 05)
- Sơ đồ Luồng Dữ liệu (Diagram 06)

#### Chapter 4: Database Design
- Auth Service ERD (Diagram 01)
- NAPAS Service ERD (Diagram 02)
- Bank Service ERD (Diagram 03)

#### Chapter 5: Implementation
- Interbank Transfer Sequence (Diagram 04)
- Data Flow Diagram (Diagram 06)

## 🔍 Chi Tiết Sơ Đồ (Diagram Details)

### ERD Diagrams (01-03)
- **Định dạng**: Mermaid ER diagrams
- **Nội dung**:
  - Cấu trúc bảng (table structures)
  - Quan hệ (relationships)
  - Ràng buộc (constraints)
  - Indexes
  - Dữ liệu mẫu (seed data)
  - Quy tắc nghiệp vụ (business rules)

### Sequence Diagram (04)
- **Định dạng**: Mermaid sequence diagram
- **Nội dung**:
  - Tương tác Actor
  - Service calls
  - Thao tác Database
  - Luồng Message queue
  - Chú thích Timeline
  - Kịch bản lỗi (error scenarios)

### Architecture Diagrams (05-06)
- **Định dạng**: Mermaid flowcharts/graphs
- **Nội dung**:
  - Cấu trúc Service (service topology)
  - Mẫu giao tiếp (communication patterns)
  - Technology stack
  - Tùy chọn mở rộng (scalability options)
  - Điểm giám sát (monitoring points)

## 📖 Thứ Tự Đọc (Reading Order)

### Để Hiểu Hệ Thống
1. Bắt đầu với **05-architecture-overview.md** (bức tranh tổng thể)
2. Đọc **06-data-flow-diagram.md** (dữ liệu di chuyển như thế nào)
3. Xem **04-sequence-interbank-transfer.md**  (luồng chi tiết)
4. Nghiên cứu ERDs **01-03** (thiết kế database)

### Để Triển Khai
1. ERDs trước **01-03** (database schema)
2. Kiến trúc **05** (cấu trúc service)
3. Sequence **04** (luồng implementation)
4. Data flow **06** (validation)

### For Presentation
1. **05** - Hiển thị kiến trúc tổng thể
2. **04** - Demo chuyển tiền liên ngân hàng
3. **02-03** - Giải thích mô hình dữ liệu
4. **06** - Thảo luận về khả năng mở rộng

## 🎨 Phong Cách Sơ Đồ (Diagram Styles)

### Mã Màu (Color Coding)
- **Tím/Xanh dương**: Liên quan Bank A
- **Xanh lá**: Liên quan Bank B
- **Hồng**: Liên quan Bank C
- **Cyan**: Liên quan Bank Napas
- **Đỏ**: Authentication related
- **Vàng**: API Gateway
- **Hồng**: Message Queue

### Ký Hiệu (Symbols)
- **🏦**: Bank/Tổ chức tài chính
- **📡**: API/Service Endpoint
- **🗄️**: Database
- **🔄**: Background Service
- **🐰**: RabbitMQ
- **📬**: Message Queue
- **🚪**: Gateway
- **🔐**: Authentication
- **👤**: User

## 🛠️ Chỉnh Sửa Sơ Đồ (Editing Diagrams)

Để sửa đổi sơ đồ:

1. Chỉnh sửa code Mermaid trong files .md
2. Test tại https://mermaid.live
3. Copy code đã cập nhật về file
4. Commit changes

### Tài nguyên Mermaid:
- [Tài liệu chính thức](https://mermaid.js.org/)
- [Live Editor](https://mermaid.live)
- [Cheat Sheet](https://jojozhuang.github.io/tutorial/mermaid-cheat-sheet/)



## 🔗  Tham Chiếu Chéo (Cross-References)

### Tài Liệu Chính
- [README.md](../README.md) - Tài liệu dự án chính

### Source Code
- [src/](../src/) - Triển khai Services
- [docker-compose.yml](../docker-compose.yml) - Setup hạ tầng
- [frontend/](../frontend/) - Giao diện người dùng


## 📝 Cập Nhật (Updates)

Khi cập nhật sơ đồ:
- [ ] Cập nhật tài liệu tương ứng
- [ ] Test render trong nhiều viewers
- [ ] Cập nhật README này nếu thêm sơ đồ mới
- [ ] Ghi chú thay đổi trong commit message

## 🤝 Đóng Góp (Contributing)

Nếu mở rộng hệ thống:
1. Tạo file sơ đồ mới theo quy ước đặt tênn
2. Cập nhật README index này
3. Tham chiếu chéo trong tài liệu chính
4. Duy trì styling và symbols nhất quán


