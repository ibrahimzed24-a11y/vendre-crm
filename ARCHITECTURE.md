# VENDRE — System Architecture Document

## 1. Executive Summary & Purpose

**VENDRE** is a private, multi-workspace internal B2B Sales Customer Relationship Management (CRM) platform. It provides end-to-end sales lifecycle management across two completely segregated business workspaces:
- **Workspace 1: VENDRE Sales** (Managing the owner's core independent sales pipeline)
- **Workspace 2: Agency Sales** (Managing the agency's separate sales pipeline)

The platform is designed with a strict zero-trust workspace boundary: no record, task, lead, deal, contact, organization, report, or audit event can leak across workspaces.

---

## 2. Technical Stack

| Tier | Technology | Purpose & Rationale |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript | Server and Client Components, fast responsive UI, enterprise UX |
| **Styling & UI** | Tailwind CSS v3/v4, Lucide Icons | Clean B2B aesthetics, dark/light contrast, accessible components |
| **Backend & APIs** | Next.js Server Actions & API Routes | Strict input validation, server-side authorization on every action |
| **Database** | PostgreSQL 16 | Relational consistency, ACID transactions, foreign keys, constraints |
| **ORM & Data Layer**| Prisma ORM | Typed schema, migrations, connection pooling, transactional integrity |
| **Authentication** | Server-side JWT / Session cookies, bcryptjs | Private accounts, no public signup, HTTP-only secure cookies |
| **Validation** | Zod | Runtime schema validation for requests and CSV row ingestion |
| **Infrastructure** | Docker Compose | Self-hostable, 100% free local development, portable deployment |
| **Testing** | Vitest, Node Test Runner, Playwright | Unit tests, security isolation tests, integration, and UI verification |

---

## 3. Core Architectural Layers

```
┌───────────────────────────────────────────────────────────────┐
│                    User Interface Layer                       │
│    Responsive Dashboard, Kanban Pipeline, Detail Views, Tables│
│     (Sidebar, Workspace Switcher, Global Search, Modals)      │
└───────────────────────────────┬───────────────────────────────┘
                                │ Server Actions / REST API
┌───────────────────────────────▼───────────────────────────────┐
│                  Security & Context Boundary                  │
│  - Session Verification (HTTP-Only Secure Cookie)             │
│  - Workspace Membership & Active Context Resolver             │
│  - Role-Based Access Control (RBAC Policy Engine)             │
└───────────────────────────────┬───────────────────────────────┘
                                │ Authorized Session + Workspace Context
┌───────────────────────────────▼───────────────────────────────┐
│                    Business Services Layer                    │
│  - LeadService (Validation, Assignment, Transactional Convert) │
│  - DealService (Stage Transitions, Owner Guard, Pipeline Calcs)│
│  - DuplicateService (Matching Engine, Transactional Merging)  │
│  - ImportExportService (CSV Sanitization, Injection Defense)  │
│  - AuditService (Immutable Log Emission)                      │
│  - ReportService (Scoped Aggregations & Metrics)              │
└───────────────────────────────┬───────────────────────────────┘
                                │ Typed Queries with workspaceId
┌───────────────────────────────▼───────────────────────────────┐
│                  Data Access & Persistence                    │
│      Prisma Client with Enforced Workspace-Scoped Predicates  │
│                      PostgreSQL 16 Engine                     │
└───────────────────────────────────────────────────────────────┘
```

---

## 4. Key Architectural Patterns

### 4.1 Strict Multi-Workspace Isolation
- All business records (`Organization`, `Contact`, `Lead`, `Deal`, `PipelineStage`, `Activity`, `Task`, `ResearchRecord`, `DuplicateCandidate`, `AuditLog`, `ImportJob`) contain a non-nullable `workspaceId` foreign key referencing `Workspace`.
- The active workspace is resolved strictly from the verified user session and their valid `WorkspaceMembership`.
- Client-supplied `workspaceId` fields in create/update payloads are discarded. The backend always stamps the verified `session.workspaceId`.
- Every query includes `{ where: { workspaceId: session.workspaceId, ... } }`.
- Cross-workspace foreign key references (e.g., trying to link a Contact from Workspace A to a Deal in Workspace B) are explicitly validated and rejected before database writes.

### 4.2 Role-Based Access Control (RBAC)
VENDRE defines five explicit roles:
1. **Owner**: Unrestricted operational, administrative, and configuration control across authorized workspaces.
2. **Admin**: Operational management, user assignment, pipeline configuration, export, and reports.
3. **Manager**: Team supervision, pipeline review, reassignments, task assignment, and sales reporting.
4. **Sales**: Management of assigned leads, deals, tasks, activity logging, and conversion.
5. **View Only**: Read-only access to authorized records. Strictly blocked from creating, editing, deleting, importing, or converting records.

### 4.3 Transactional Lead-to-Deal Conversion
Lead conversion is executed inside a PostgreSQL database transaction (`prisma.$transaction`):
1. Verifies caller has mutate permissions (`Owner`, `Admin`, `Manager`, `Sales`).
2. Confirms Lead exists in the active workspace and status is not already `Converted`.
3. Confirms target PipelineStage belongs to the active workspace.
4. Validates that the linked Contact and Organization exist and belong to the active workspace.
5. Creates the new `Deal` record with stage, value, estimated close date, and derived ownership.
6. Updates `Lead` status to `Converted` and stores `convertedDealId`.
7. Emits an `AuditLog` entry detailing the conversion event.
8. If any step fails, the entire transaction rolls back cleanly.

### 4.4 Formula Injection Defense in CSV Processing
All CSV export and import routines incorporate formula injection defense:
- Fields starting with `=`, `+`, `-`, `@`, `\t`, or `\r` are sanitized by prepending a single quote `'` or stripping formula prefixes to prevent spreadsheet command execution.
- Imports validate every row strictly with Zod before transactional commit.

### 4.5 Self-Hostable and Zero Paid Infrastructure
The application requires zero paid third-party APIs, SaaS subscriptions, or cloud billing. It runs locally and in containerized self-hosted environments with standard Docker and Node.js runtimes.
