# Off-Campus Housing Management System (Verified Housing for Students & Workers)

## 1) Brief Description (Problem + Solution)
**Problem:** Students and workers near universities/industrial zones often find housing through Facebook/Zalo groups. This leads to unverified listings, inconsistent information, no contract standardization, and difficult handling of disputes/safety/maintenance issues.

**Solution:** This project builds an **Off-Campus Housing Management System** that connects:
- **Landlords** (create/manage listings, handle contracts, respond to issues)
- **Students/Workers** (search verified listings, submit rental requests, sign contracts, report issues)
- **University Admin / Industrial Park Management** (verify landlords/properties, manage incidents and trust)

Key focus: **verified listings, structured contracts, and issue/incident workflows**.

---

## 2) Functional Requirements
### 2.1 User & Access
- User registration/login (Landlord / Tenant / Admin roles)
- Profile management (contact info, affiliation if applicable)
- Role-based dashboards and permissions

### 2.2 Listings & Search
- Landlord can create/update/delete listings (property/room, price, deposit, availability, amenities)
- Tenant can browse/search/filter listings (price, distance, type, availability, amenities)
- Listing verification badge (Verified / Pending / Rejected)

### 2.3 Rental Requests & Contracting
- Tenant submits rental requests to a listing
- Landlord can accept/reject requests
- Generate a contract from an accepted request
- Contract lifecycle: `DRAFT -> SENT -> SIGNED -> ACTIVE -> TERMINATED`
- Support shared housing: multiple tenants in one contract (contract-tenants)

### 2.4 Issue Reporting (Incidents / Maintenance / Disputes)
- Tenant or landlord can create issue reports linked to a contract
- Issue categorization (maintenance, safety, noise, scam, hygiene, dispute)
- Admin can triage/assign issues; track status + resolution time
- Evidence attachments (photos/documents) for issue reports (metadata + file links)

### 2.5 Reviews & Feedback (Verified Stays)
- Tenants can review listing/landlord **only after a valid contract**
- Ratings + comments, with “verified stay” derived from contract

### 2.6 Admin Verification & Governance
- Admin verifies landlords and/or properties (inspection/approval workflow)
- Admin analytics dashboard (verification stats, incident counts, response time)

---

## 3) Non-Functional Requirements
- **Data Integrity:** FK constraints, unique constraints, NOT NULL, controlled status enums
- **3NF Design:** minimize redundancy (use IDs instead of duplicated username/email in tables)
- **Security:** RBAC (roles/privileges), password hashing, least-privilege DB users
- **Reliability:** audit logs for critical actions (contract state changes, issue resolution)
- **Performance:** indexes on common filters and joins; evidence of query optimization
- **Scalability:** design supports multiple organizations (universities/industrial zones)
- **Maintainability:** clean schema naming conventions; predictable repository structure
- **Web Integration:** CRUD interface + API endpoints + validation to prevent SQL injection
- **Testing:** unit + integration tests; test dataset; reproducible scripts

---

## 4) Planned Core Entities (Brief Outline)
> Final ERD will include at least **4+ entities** (requirement), but our MVP includes more for realism.

### Core
- **users**: accounts, roles (landlord/tenant/admin), status
- **organizations**: university/industrial park/company (optional but recommended)
- **user_affiliations**: links users to organizations (verification context)
- **properties**: owned by landlord, address, zone/org association
- **rooms**: belongs to a property, capacity, base rent
- **listings**: references either a property or a room (exactly one), price/deposit/status
- **rental_requests**: tenant requests a listing; status tracking
- **contracts**: created from accepted request; rent/deposit/dates/status
- **contract_tenants**: many-to-many for shared contracts
- **issue_reports**: incidents linked to contract, status, severity, assignment
- **issue_attachments**: file metadata for issues (URL/path + uploader)
- **reviews**: contract-bound reviews; rating/comment; target type (listing/landlord)
- **verifications**: admin verification workflow for landlord/property/listing
- **audit_logs**: records important actions for accountability

---

## 5) Tech Stack
**Database:** MySQL 8 (or PostgreSQL 15+ if allowed)  
**Backend API:** Node.js + Express (or Flask)  
**Frontend:** React (or simple server-rendered pages if scope is tight)  
**Auth:** JWT/session + bcrypt password hashing  
**ORM (optional):** Prisma / Sequelize (or raw SQL with prepared statements)  
**DevOps:** Docker + docker-compose (recommended for reproducibility)  
**Testing:** Postman collection + backend unit tests (Jest/PyTest)

---

## 6) Team Members and Roles
> Replace names as needed.

- **Member 1 (Name):** Project Manager + Requirements + Documentation
- **Member 2 (Name):** Database Architect (ERD, normalization, DDL, views, indexes)
- **Member 3 (Name):** Backend Developer (API, procedures integration, auth)
- **Member 4 (Name):** Frontend Developer (UI, CRUD flows, admin dashboard)
- **Member 5 (Name, optional):** QA/Security (test plan, SQL injection prevention, RBAC)

---

## 7) Timeline (Planned Milestones)
### Milestone 1 — Team registration & topic selection (**Dec 1, 2025**)
**Deliverables/Notes:**
- Finalize project scope + roles
- Confirm MVP workflows (listing → request → contract → issue → review)
- Initial ERD draft (rough) and repository setup

### Milestone 2 — Peer review of proposals (**Dec 8, 2025**)
**Deliverables/Notes:**
- One-page proposal + refined ERD (entities + relationships + cardinalities)
- Risk list (scope risks, schedule risks)
- Incorporate feedback: clarify verification + contract parties + issue workflow

### Milestone 3 — Submit design document (ERD, DDL, task division) (**Dec 15, 2025**)
**Deliverables/Notes:**
- ERD final (4+ entities, normalized to 3NF)
- Accurate DDL scripts (tables + constraints + indexes)
- Include:
  - **≥ 1 view**
  - Plan for **≥ 2 stored procedures**
  - Plan for **≥ 1 trigger**
- Task breakdown by teammate + start implementing DB

### Milestone 4 — Final submission & presentation slides (**Dec 22, 2025**)
**Deliverables/Notes:**
- Working web app (CRUD + key workflows)
- Demonstrate:
  - Views
  - 2 procedures
  - 1 trigger
  - Indexing/optimization evidence (EXPLAIN, before/after timing, etc.)
  - Security configuration (roles/privileges, prepared statements, hashing/encryption)
- Slides: architecture, ERD, demo flow, performance + security highlights
- Final report + reproducible setup steps

---

## 8) Academic / Evaluation Requirements Checklist (Rubric Alignment)
### 8.1 Conceptual & Physical Design (4 pts)
- [ ] Requirements documented
- [ ] ERD with **4+ entities**
- [ ] 3NF (avoid redundant username/email copies across tables)
- [ ] Accurate DDL

### 8.2 Implementation of DB Entities (4 pts)
- [ ] Tables implemented
- [ ] **Views** implemented
- [ ] **≥ 2 stored procedures**
- [ ] **≥ 1 trigger**

### 8.3 Performance Tuning (3 pts)
- [ ] Indexes (FK indexes + search filters)
- [ ] Query optimization evidence (EXPLAIN / before-after comparisons)
- [ ] Optional: partitioning (issues/contracts by date) if dataset grows

### 8.4 Security Configuration (3 pts)
- [ ] DB roles/privileges (least privilege)
- [ ] Encryption/hashing strategy (passwords + sensitive fields as needed)
- [ ] SQL injection prevention (prepared statements / ORM)

### 8.5 Testing & Web Integration (4 pts)
- [ ] Functional website + CRUD
- [ ] Analytics queries (admin dashboard)
- [ ] Thorough testing (test cases + screenshots/logs)

### 8.6 Presentation & Documentation (2 pts)
- [ ] Clear architecture + reproducible code (README + scripts)
- [ ] Slides & report included

---

## 9) Repository Structure (Suggested)

---

## 10) How to Run (Example)
1. Create database and user (MySQL)
2. Run `/db/schema.sql`, then `/db/seed.sql`
3. Start backend (`/api`)
4. Start frontend (`/web`)
5. Open app in browser and test core flows

---

## 11) Core MVP Demo Flow (What we will show)
1) Admin verifies landlord/property → listing becomes “Verified”  
2) Tenant searches → submits rental request  
3) Landlord accepts → contract created → signatures recorded  
4) Tenant reports an issue → admin assigns → resolution tracked  
5) Tenant submits review (only after contract)  
