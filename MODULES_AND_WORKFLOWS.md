# VENDRE — Modules & Workflows Documentation

This document provides a comprehensive operational guide to each functional module within the VENDRE CRM platform.

---

## 1. Authentication & Workspace Context

### Workflow
1. User navigates to `/login`.
2. Signs in with email and password (or selects one-click demo credentials).
3. The server validates credentials, verifies active membership, and issues an `HttpOnly` HMAC-signed session cookie.
4. User lands on `/` (Executive Dashboard) scoped to their primary authorized workspace.
5. Workspace Switcher in the top header allows instant switching between **VENDRE Sales** and **Agency Sales** (restricted to authorized memberships).

---

## 2. Executive Dashboard (`/`)

### Key Capabilities
- **Real-Time KPI Cards**: Pipeline Value, Closed Won Revenue, Win Rate percentage, and Lead Conversion Rate.
- **Entity Counts**: Active Organizations, Contacts, Overdue Tasks, Completed Activities.
- **Date Range Filters**: All Time, This Month, Quarter, Year.
- **Stage Distribution Bar**: Visual breakdown of deals and monetary volume across pipeline stages.
- **Lead Source Breakdown**: Acquisition channels (Webinar, Referral, Inbound, etc.).
- **Live Activity Feed**: Most recent customer interactions with record links.
- **Upcoming Follow-Ups**: Prospective leads with scheduled follow-ups in the next 7 days.

---

## 3. Organizations Module (`/organizations`)

### Key Capabilities
- **Listing & Filtering**: Search by name, industry, city, or email; display related contact/deal counts.
- **Safe Creation**: Validate unique fields and verify owner belongs to the active workspace.
- **Detail View (`/organizations/[id]`)**:
  - Company overview (website, address, phone, email, notes).
  - Tabbed sub-views: Related Contacts, Related Leads, Pipeline Deals, Activity Timeline, Tasks, and Market Research.
  - Quick-action buttons to add contact, create lead, add deal, log activity, or schedule task directly from the organization view.
- **Safe Deletion Policy**: Deleting an organization with active deals or leads is blocked server-side until dependent entities are reassigned or closed.

---

## 4. Contacts Module (`/contacts`)

### Key Capabilities
- **Listing & Search**: Search across first name, last name, email, phone, job title, and organization.
- **Detail View (`/contacts/[id]`)**: Full stakeholder history, linked company, active deals, leads, logged touchpoints, and scheduled tasks.
- **Relational Integrity**: Linking an organization requires server verification that the organization exists within the active workspace.

---

## 5. Leads Module (`/leads`)

### Key Capabilities
- **Lead Lifecycle**: Track prospective deals through statuses: `NEW` ➔ `CONTACTED` ➔ `QUALIFIED` ➔ `CONVERTED` (or `UNQUALIFIED`).
- **Priority & Follow-Up Tracking**: Low, Medium, High, Urgent priorities with next follow-up date alerts.
- **Transactional Conversion to Deal**:
  - Available to Owner, Admin, Manager, and Sales roles.
  - Launches `LeadConvertModal` allowing selection of destination Pipeline Stage, Deal value, currency, and target close date.
  - Executes inside a database transaction (`prisma.$transaction`):
    1. Validates Lead belongs to active workspace and is not already converted.
    2. Validates destination Stage belongs to active workspace.
    3. Creates Deal with inherited Organization and Contact references.
    4. Updates Lead status to `CONVERTED` and saves `convertedDealId`.
    5. Re-links existing Lead activities and tasks to the newly created Deal.
    6. Emits `LEAD_CONVERTED` audit event.

---

## 6. Deals & Pipeline Kanban (`/pipeline` & `/deals`)

### Key Capabilities
- **Interactive Kanban Board (`/pipeline`)**:
  - Visual stage columns arranged in configured `displayOrder`.
  - Column headers summarize deal counts and cumulative monetary value.
  - Deal cards display title, value, probability, contact name, and company.
  - Quick stage advance controls (`Prev` / `Next`) update stage and deal probability in real time.
- **Deals Table View (`/deals`)**:
  - Search, stage filter, status filter (`OPEN`, `WON`, `LOST`).
  - Expected close date tracking.
- **Deal Detail (`/deals/[id]`)**:
  - Visual stage tracker.
  - Log interactions (calls, meetings, notes, WhatsApp).
  - Manage deal action items and tasks.

---

## 7. Activities Module (`/activities`)

### Key Capabilities
- **Multi-Type Logging**: Calls, Emails, Meetings, WhatsApp messages, Internal Notes, and Follow-ups.
- **Server-Derived Author**: The active session user is automatically recorded as author.
- **Relational Context**: Can link to Organization, Contact, Lead, and Deal simultaneously.

---

## 8. Tasks Module (`/tasks`)

### Key Capabilities
- **Category Tabs**: "My Tasks", "Team Tasks", "Overdue", and "Completed".
- **Access Controlled Assignment**: Managers and Admins can assign tasks across team members; Sales reps assign tasks to themselves.
- **Interactive Completion**: Checkbox click toggles status between `PENDING` and `COMPLETED`, stamping `completedAt`.

---

## 9. Research Intelligence Module (`/research`)

### Key Capabilities
- **Categorized Intel**: `ORGANIZATION`, `CONTACT`, `INDUSTRY`, `MARKET`, `COMPETITOR`, `OPPORTUNITY`.
- **Card Repository**: Title, description, category badge, external source URL, author, and timestamp.
- **Safe Storage**: Completely self-contained; does not trigger external web scraping or third-party APIs.

---

## 10. Duplicate Management (`/duplicates`)

### Key Capabilities
- **Automated Workspace Scanner**: Evaluates contacts matching email/phone and organizations matching normalized company names.
- **Candidate Console**: Displays match confidence score, match reason, and record comparisons.
- **Transactional Merge**:
  - Owner/Admin/Manager reviews side-by-side comparison.
  - Re-assigns all child entities (Contacts, Leads, Deals, Activities, Tasks, Research) to the primary record.
  - Fills in missing fields on primary record from duplicate record.
  - Deletes duplicate record and marks candidate `MERGED`.
  - Records full audit event.

---

## 11. Global Multi-Entity Search

### Key Capabilities
- **Quick Shortcut**: Press `Cmd+K` or click header search bar anywhere in the app.
- **Instant Query**: Searches Organizations, Contacts, Leads, Deals, and Tasks in real time.
- **Strict Tenant Filtering**: All queries enforce `{ workspaceId: session.workspaceId }` at the database level.
- **Direct Navigation**: Click or keyboard-select any result to jump directly to its detail view.

---

## 12. CSV Import & Export

### Key Capabilities
- **Export**: Generates clean CSV files for Organizations, Contacts, Leads, and Deals.
- **Formula Injection Defense**: Neutralizes leading `=`, `+`, `-`, `@`, `\t`, `\r` characters by prepending `'`.
- **Import Wizard**:
  - Upload CSV file for Organizations, Contacts, or Leads.
  - Previews row count, parses headers, executes Zod row validation.
  - Imports in transaction and displays row-by-row validation error report.

---

## 13. Audit Log (`/audit-logs`)

### Key Capabilities
- **Restricted Access**: Available exclusively to `OWNER` and `ADMIN` roles.
- **Immutable Log Entries**: Timestamps, User, Action, Entity Type, Entity ID, and Sanitized Metadata.
- **Covered Events**: Logins, workspace switches, creations, updates, deletes, lead conversions, stage changes, imports, and merges.

---

## 14. Workspace Settings (`/settings`)

### Key Capabilities
- **Workspace Profile**: View name, slug, and UUID.
- **Team Members & Permissions**: Review all authorized users and their assigned roles.
- **Pipeline Stage Configuration**:
  - Add custom stages with hex color pickers and Won/Lost tags.
  - Safe deletion: If deals exist in a stage, the system prompts for a target reassignment stage to prevent orphaned deals.
