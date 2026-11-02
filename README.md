# VENDRE — Private Sales CRM Platform

> **VENDRE** is a private, enterprise-grade, multi-workspace Sales CRM engineered from scratch for high-velocity sales lifecycle management, multi-team isolation, and actionable pipeline analytics.

---

## Key Highlights

- **Complete Workspace Isolation**: Two distinct operations — *VENDRE Sales* and *Agency Sales* — partitioned at the database query level with zero data leakage.
- **Role-Based Access Control**: Granular permission matrix across Owner, Admin, Manager, Sales, and View-Only roles.
- **End-to-End Sales Lifecycle**: Organizations, Contacts, Leads, Kanban Pipeline, Deals, Activities, and Task management.
- **Transactional Lead Conversion**: Atomic conversion from qualified Lead to Deal with automatic audit trail and relationship integrity.
- **Productivity Engine**: Duplicate record detection and merging, global multi-entity search, and formula-injection-protected CSV import/export.
- **Executive Analytics**: Real-time sales velocity, revenue trends, pipeline breakdown, win/loss metrics, and audit logs.
- **Zero Paid Dependencies**: 100% self-hostable with local Dockerized PostgreSQL, Next.js, and Prisma ORM.

---

## Quick Start (Local Development)

```bash
# 1. Start the PostgreSQL database
docker compose up -d

# 2. Install dependencies
npm install

# 3. Apply Prisma migrations and generate client
npx prisma migrate dev --name init

# 4. Seed the database with demo users, stages, and records
npx prisma db seed

# 5. Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and sign in using the seed accounts documented in [LOCAL_SETUP.md](./LOCAL_SETUP.md).

---

## Connecting to Remote GitHub Repository

To connect this local repository to `vendre-crm-platform`:

```bash
# 1. Add your private remote
git remote add origin git@github.com:<your-organization>/vendre-crm-platform.git

# 2. Push development branch
git push -u origin development

# 3. Create default main/production branch
git checkout -b main
git push -u origin main
git checkout development
```

---

## Architecture & Documentation Index

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System architecture, design decisions, and component layout.
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — ER diagram, entity specifications, and indexing rules.
- [SECURITY_MODEL.md](./SECURITY_MODEL.md) — RBAC matrix, session management, and injection defense.
- [WORKSPACE_ISOLATION.md](./WORKSPACE_ISOLATION.md) — Zero-trust multi-tenancy verification and scoping.
- [USER_ROLES.md](./USER_ROLES.md) — Role definitions, permissions, and server enforcement.
- [MODULES_AND_WORKFLOWS.md](./MODULES_AND_WORKFLOWS.md) — Detailed functional specification of all CRM modules.
- [LOCAL_SETUP.md](./LOCAL_SETUP.md) — Step-by-step local setup, Docker config, and seed credentials.
- [TESTING.md](./TESTING.md) — Automated testing strategy, test suites, and verification instructions.
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Production self-hosting guidelines and Docker containerization.
- [MVP_LIMITATIONS.md](./MVP_LIMITATIONS.md) — Current scope, boundary conditions, and roadmap.
- [CHANGELOG.md](./CHANGELOG.md) — Version history and release notes.
