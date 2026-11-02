# VENDRE — Local Setup & Development Guide

This guide describes how to run and verify VENDRE CRM locally on macOS or Linux with zero paid third-party infrastructure.

---

## 1. Prerequisites

- **Node.js**: v18.x, v20.x, or v22+ (tested on v24.22.1).
- **npm**: v9+ (tested on 11.19.1).
- **Docker & Docker Compose**: For local PostgreSQL 16 container.
- **Git**: For version control.

---

## 2. Step-by-Step Local Setup

### Step 1: Start PostgreSQL via Docker Compose
From the `vendre-crm` directory:
```bash
docker compose up -d
```
Verify that the database container is healthy:
```bash
docker ps
```
The container `vendre-postgres` should be running on port `5432`.

### Step 2: Environment Configuration
Copy `.env.example` to `.env` if not already present:
```bash
cp .env.example .env
```
Default connection string:
```ini
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vendre_crm?schema=public"
SESSION_SECRET="vendre_crm_super_secure_development_secret_key_minimum_32_characters_long_123"
COOKIE_NAME="vendre_session"
PORT=3000
```

### Step 3: Install Node Dependencies
```bash
npm install
```

### Step 4: Apply Database Migrations and Generate Prisma Client
```bash
npx prisma db push
```

### Step 5: Seed the Database with Isolated Multi-Workspace Data
```bash
npm run db:seed
```
This script initializes:
- Two segregated workspaces: **VENDRE Sales** (`vendre-sales`) and **Agency Sales** (`agency-sales`).
- Standard 7-stage sales pipelines for both workspaces.
- Preconfigured accounts across all RBAC roles.
- Seed organizations, contacts, leads, deals, activities, tasks, research briefs, and audit logs.

### Step 6: Start the Development Server
```bash
npm run dev
```
Open your browser at [http://localhost:3000](http://localhost:3000).

---

## 3. Seed User Credentials Matrix

All seed accounts use the default password: **`Vendre2025!`**

| Email | Name | Workspaces | Role |
| :--- | :--- | :--- | :--- |
| **`owner@vendre.com`** | Ibrahim Zed | VENDRE Sales & Agency Sales | **OWNER** (Full Access) |
| **`admin@vendre.com`** | Sarah Jenkins | VENDRE Sales | **ADMIN** |
| **`manager@vendre.com`** | Marcus Vance | VENDRE Sales | **MANAGER** |
| **`sales@vendre.com`** | David Miller | VENDRE Sales | **SALES** |
| **`viewer@vendre.com`** | Claire Dupont | VENDRE Sales | **VIEW_ONLY** |
| **`agency.lead@vendre.com`** | Elena Rostova | Agency Sales | **MANAGER** |
| **`agency.sales@vendre.com`** | Lucas Thorne | Agency Sales | **SALES** |

---

## 4. Running the Automated Test Suite

```bash
npm test
```
Runs 24 automated unit and integration tests covering workspace security, role permissions, lead conversion atomicity, CSV sanitization, and duplicate merging.
