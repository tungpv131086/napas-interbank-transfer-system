# NAPAS Simulation - Architecture Diagrams

This directory contains comprehensive Mermaid diagrams for the NAPAS 24/7 Fast Interbank Transfer System.

## 📊 Diagram Index

### 1. Entity Relationship Diagrams (ERDs)

#### [01-erd-auth-service.md](01-erd-auth-service.md)
**Auth Service Database Schema**
- Users table with authentication credentials
- Bank code associations
- Role-based access
- Seed data for demo users

#### [02-erd-napas-service.md](02-erd-napas-service.md)
**NAPAS Service Database Schema**
- NapasTransactions: Complete interbank transaction records
- ReconciliationRecords: Settlement and audit trail
- Indexes and business rules

#### [03-erd-bank-service.md](03-erd-bank-service.md)
**Bank Service Database Schema (A, B, C)**
- Accounts: Customer accounts with balances
- Transactions: Internal and interbank transfers
- Seed data for all three banks
- Business rules and constraints

### 2. Process Diagrams

#### [04-sequence-interbank-transfer.md](04-sequence-interbank-transfer.md)
**Interbank Transfer Sequence Diagram**
- Complete step-by-step flow from sender to receiver
- Shows all microservices interactions
- Message queue communication
- Database operations
- Error handling scenarios
- Timeline with performance metrics

### 3. Architecture Diagrams

#### [05-architecture-overview.md](05-architecture-overview.md)
**High-Level System Architecture**
- All microservices and their relationships
- Database per service pattern
- Message broker infrastructure
- API Gateway routing
- Frontend applications
- Technology stack
- Scalability considerations

#### [06-data-flow-diagram.md](06-data-flow-diagram.md)
**Data Flow & Microservices Interaction**
- Complete data flow through the system
- Message queue patterns
- Synchronous vs asynchronous flows
- Error handling flows
- Performance characteristics
- Consistency models

## 🎯 How to Use These Diagrams

### Viewing Diagrams

All diagrams use **Mermaid** syntax and can be viewed in:

1. **GitHub**: Automatically rendered when viewing .md files
2. **VS Code**: Install "Markdown Preview Mermaid Support" extension
3. **Online**: Copy code to https://mermaid.live
4. **Documentation Tools**: Most support Mermaid (GitBook, Docusaurus, etc.)

### For Presentations

1. **Screenshot**: Take screenshots from GitHub or Mermaid Live
2. **Export**: Use Mermaid Live to export as PNG/SVG
3. **Live Demo**: Show directly in VS Code or GitHub
4. **PowerPoint**: Copy exported images into slides

### For Thesis/Capstone

Include these diagrams in your document:

#### Chapter 3: System Design
- Architecture Overview (Diagram 05)
- Data Flow Diagram (Diagram 06)

#### Chapter 4: Database Design
- Auth Service ERD (Diagram 01)
- NAPAS Service ERD (Diagram 02)
- Bank Service ERD (Diagram 03)

#### Chapter 5: Implementation
- Interbank Transfer Sequence (Diagram 04)
- Data Flow Diagram (Diagram 06)

## 🔍 Diagram Details

### ERD Diagrams (01-03)
- **Format**: Mermaid ER diagrams
- **Content**:
  - Table structures
  - Relationships
  - Constraints
  - Indexes
  - Seed data
  - Business rules

### Sequence Diagram (04)
- **Format**: Mermaid sequence diagram
- **Content**:
  - Actor interactions
  - Service calls
  - Database operations
  - Message queue flows
  - Timeline annotations
  - Error scenarios

### Architecture Diagrams (05-06)
- **Format**: Mermaid flowcharts/graphs
- **Content**:
  - Service topology
  - Communication patterns
  - Technology stack
  - Scalability options
  - Monitoring points

## 📖 Reading Order

### For Understanding the System
1. Start with **05-architecture-overview.md** (big picture)
2. Read **06-data-flow-diagram.md** (how data moves)
3. Review **04-sequence-interbank-transfer.md** (detailed flow)
4. Study ERDs **01-03** (database design)

### For Implementation
1. ERDs first **01-03** (database schema)
2. Architecture **05** (service structure)
3. Sequence **04** (implementation flow)
4. Data flow **06** (validation)

### For Presentation
1. **05** - Show overall architecture
2. **04** - Demonstrate interbank transfer
3. **02-03** - Explain data model
4. **06** - Discuss scalability

## 🎨 Diagram Styles

### Color Coding
- **Purple/Blue**: Bank A related
- **Green**: Bank B related
- **Pink**: Bank C related
- **Cyan**: NAPAS related
- **Red**: Authentication related
- **Yellow**: API Gateway
- **Pink**: Message Queue

### Symbols
- **🏦**: Bank/Financial Institution
- **📡**: API/Service Endpoint
- **🗄️**: Database
- **🔄**: Background Service
- **🐰**: RabbitMQ
- **📬**: Message Queue
- **🚪**: Gateway
- **🔐**: Authentication
- **👤**: User

## 🛠️ Editing Diagrams

To modify diagrams:

1. Edit the Mermaid code in the .md files
2. Test in https://mermaid.live
3. Copy updated code back to file
4. Commit changes

### Mermaid Resources
- [Official Docs](https://mermaid.js.org/)
- [Live Editor](https://mermaid.live)
- [Cheat Sheet](https://jojozhuang.github.io/tutorial/mermaid-cheat-sheet/)

## 📊 Print-Ready Versions

To create print-ready diagrams:

1. Open diagram in Mermaid Live
2. Click "Actions" → "PNG" or "SVG"
3. Download high-resolution image
4. Insert into Word/LaTeX document

Recommended settings:
- **Format**: PNG or SVG
- **Resolution**: 300 DPI minimum
- **Size**: Scale to fit page width

## 🔗 Cross-References

### Main Documentation
- [README.md](../README.md) - Main project documentation
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Technical architecture details
- [TESTING.md](../TESTING.md) - Testing scenarios
- [DEMO_SCRIPT.md](../DEMO_SCRIPT.md) - Presentation guide

### Source Code
- [src/](../src/) - Service implementations
- [docker-compose.yml](../docker-compose.yml) - Infrastructure setup
- [frontend/](../frontend/) - User interfaces

## 💡 Tips

1. **For Academic Papers**: Export as high-quality SVG for perfect scaling
2. **For Presentations**: Use PNG with transparent background
3. **For Documentation**: Keep Mermaid code inline for easy updates
4. **For Collaboration**: Share Mermaid Live links for review

## 📝 Updates

When updating diagrams:
- [ ] Update corresponding documentation
- [ ] Test rendering in multiple viewers
- [ ] Update this README if adding new diagrams
- [ ] Include change notes in commit message

## 🤝 Contributing

If you extend this system:
1. Create new diagram files following naming convention
2. Update this README index
3. Cross-reference in main documentation
4. Maintain consistent styling and symbols

---

**All diagrams are created with Mermaid for easy maintenance and version control.**

Last updated: December 2024
