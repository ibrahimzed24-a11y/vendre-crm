# VENDRE — User Roles & Permissions

## 1. Role Definitions

### 1.1 OWNER
- **Scope**: Top-level administrative and operational authority.
- **Capabilities**:
  - Full CRUD across all workspace entities.
  - Manage workspace memberships, invite users, update user roles, and deactivate memberships.
  - Configure pipeline stages (create, reorder, edit, delete with safe deal reassignment).
  - Manage duplicate resolution and execute entity merges.
  - Execute batch CSV imports and exports.
  - Access executive dashboards, revenue reporting, and sales forecasts.
  - View workspace audit logs.

### 1.2 ADMIN
- **Scope**: Daily workspace operational manager.
- **Capabilities**:
  - Full CRUD across all business entities (Organizations, Contacts, Leads, Deals).
  - Manage pipeline stages.
  - Reassign record ownership across team members.
  - Convert Leads to Deals.
  - Review and merge duplicate records.
  - Run CSV imports and exports.
  - Access all operational reports and audit logs.
  - Cannot alter Owner memberships or delete the workspace.

### 1.3 MANAGER
- **Scope**: Sales team supervisor.
- **Capabilities**:
  - View all team records within the active workspace.
  - Create and edit Organizations, Contacts, Leads, and Deals.
  - Convert Leads to Deals.
  - Reassign leads and deals among sales representatives.
  - Assign tasks to any active workspace user.
  - Access sales performance reports and pipeline analytics.
  - Cannot modify pipeline stages or access workspace membership management.

### 1.4 SALES
- **Scope**: Individual sales representative.
- **Capabilities**:
  - View all workspace organizations and contacts for collaboration.
  - Create new Organizations, Contacts, Leads, and Deals.
  - Manage and update assigned Leads and Deals.
  - Log activities (Calls, Meetings, Emails, WhatsApp, Notes).
  - Create and manage tasks assigned to themselves.
  - Convert qualified assigned Leads to Deals.
  - Cannot reassign records to other representatives without Manager approval.
  - Cannot delete organizations or deals.
  - Cannot alter pipeline stages or access audit logs.

### 1.5 VIEW ONLY
- **Scope**: Read-only auditor or stakeholder.
- **Capabilities**:
  - Read authorized Organizations, Contacts, Leads, Deals, Pipeline, and Tasks.
  - View read-only dashboard metrics.
  - **Strictly blocked** from:
    - Creating any record.
    - Modifying any record.
    - Deleting any record.
    - Converting Leads to Deals.
    - Importing or exporting CSV files.
    - Logging activities or completing tasks.
    - Accessing audit logs.

---

## 2. Server-Side Enforcement Pattern

Authorization is enforced via the `hasPermission(role, action)` helper and `requirePermission` utility:

```typescript
export function requirePermission(membershipRole: Role, action: Action) {
  if (!isActionAllowed(membershipRole, action)) {
    throw new ForbiddenError(`Role ${membershipRole} is not authorized to perform ${action}`);
  }
}
```
All Server Actions and API Route handlers check permission prior to executing business services.
