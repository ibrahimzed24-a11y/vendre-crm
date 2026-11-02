# VENDRE — MVP Scope & Known Limitations

## 1. MVP Purpose & Architectural Boundaries

VENDRE MVP was engineered as a private, secure, self-hostable Sales CRM designed for two independent workspaces: **VENDRE Sales** and **Agency Sales**.

In accordance with strict cost and infrastructure restrictions:
- No paid cloud infrastructure or external runtime APIs were provisioned.
- No third-party AI or email sending services were embedded.
- Data persistence is managed entirely by localized PostgreSQL.

---

## 2. Implemented Capabilities in MVP

- **Multi-Workspace Isolation**: Zero-trust tenancy enforced server-side.
- **RBAC**: Owner, Admin, Manager, Sales, View Only roles.
- **Complete Sales Lifecycle**: Organizations, Contacts, Leads, Kanban Pipeline, Deals, Activities, Tasks.
- **Atomic Lead Conversion**: Database transaction guarantees data integrity and rollback on failure.
- **Duplicate Management**: Automated duplicate detection with transactional merge and child entity preservation.
- **Global Search**: Modal search across 5 entity types scoped to active workspace.
- **Formula-Protected CSV Import/Export**: CWE-1236 mitigation and batch validation.
- **Audit Logging**: Immutable event ledger for all administrative and data mutations.

---

## 3. Current Scope Limitations & Roadmap for Production

### 3.1 Email Integration
- **Current State**: Activities record manual email logs, subjects, and descriptions.
- **Future Enhancement**: Connect to self-hosted IMAP/SMTP or private mail gateway for automatic bidirectional thread synchronization upon owner authorization.

### 3.2 Calendar Synchronization
- **Current State**: Tasks and follow-up dates are stored in PostgreSQL with visual alerts and date sorting.
- **Future Enhancement**: CalDAV or iCalendar (.ics) feed subscription export for Outlook/Apple Calendar/Google Calendar.

### 3.3 Public API & Webhooks
- **Current State**: REST endpoints and Server Actions are authenticated via session cookies.
- **Future Enhancement**: Optional API key generation for private programmatic ingest from marketing landing pages.

### 3.4 Soft Deletes
- **Current State**: Deletions are safeguarded with strict dependency verification (e.g. blocking deletion of organizations with open deals).
- **Future Enhancement**: Add `deletedAt` soft delete timestamps with an administrative recycle bin if audit retention regulations mandate archival.
