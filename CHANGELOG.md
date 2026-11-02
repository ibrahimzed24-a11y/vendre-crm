# Changelog

All notable changes to the **VENDRE** CRM platform are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-02

### Added
- **Fresh Git Repository**: Initialized independent `development` branch cleanly isolated from legacy WordPress CRM.
- **Docker Infrastructure**: PostgreSQL 16 container definition with healthchecks and persistent data volume.
- **Prisma Relational Schema**: Versioned relational models for Users, Workspaces, Memberships, Organizations, Contacts, Leads, Deals, PipelineStages, Activities, Tasks, ResearchRecords, DuplicateCandidates, ImportJobs, and AuditLogs.
- **Zero-Trust Multi-Workspace Architecture**: Complete tenancy partitioning between "VENDRE Sales" and "Agency Sales" enforced at the server action and query levels.
- **Granular RBAC**: Role-based access control across `OWNER`, `ADMIN`, `MANAGER`, `SALES`, and `VIEW_ONLY`.
- **Authentication Engine**: Bcrypt password hashing and HMAC-signed cryptographic session cookies with `HttpOnly` and `SameSite` flags.
- **Executive Dashboard**: Real-time sales velocity, pipeline value, won revenue, win rate, and lead conversion metrics with date filtering.
- **Organizations Module**: Account management, company hierarchy, search, filter, safe deletion guard, and detail views.
- **Contacts Module**: Stakeholder management with organization associations, communication channels, and detail timelines.
- **Leads Module & Conversion**: Opportunity tracking across 5 qualification states with atomic transactional conversion to Deals.
- **Deals & Pipeline Kanban**: Visual sales pipeline with interactive stage advance controls, deal probability recalculations, and table views.
- **Activities Timeline**: Multi-channel activity logging (Call, Meeting, Email, WhatsApp, Note, Follow-up) with server-derived authors.
- **Tasks Management**: Action items categorized by My Tasks, Team Tasks, and Overdue reminders with status toggling.
- **Research Module**: Categorized market, competitive, and industry qualitative intelligence cards.
- **Duplicate Detection & Merge**: Automated candidate detection scanner and transactional merge engine re-linking dependent records.
- **Global Search**: Modal search across 5 entity types scoped strictly to the caller's active workspace.
- **Formula-Protected CSV Processing**: CWE-1236 mitigation and batch validation for imports and exports.
- **Immutable Audit Trail**: Security and mutation logging restricted to Owner and Admin roles.
- **Automated Test Suite**: 24 Vitest integration tests covering workspace security, role permissions, conversion atomicity, CSV sanitization, and duplicate merging.
