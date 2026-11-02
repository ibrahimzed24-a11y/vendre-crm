# VENDRE — Workspace Isolation Architecture

## 1. Zero-Trust Multi-Tenancy Architecture

VENDRE is structured around two dedicated workspace environments:
1. **VENDRE Sales** (`vendre-sales`): The primary business and direct sales operation.
2. **Agency Sales** (`agency-sales`): The agency partner operation.

Despite sharing a single database engine and application container, data isolation between these two workspaces is mathematically enforced at the query and service levels.

---

## 2. Workspace Scoping Rules

### 2.1 Server-Derived Workspace Context
- The active workspace ID is extracted strictly from the authenticated user's verified session token (`session.workspaceId`).
- Client requests that include `workspaceId` in JSON bodies, query parameters, or form payloads are overwritten or rejected.
- When a user switches workspaces, the server verifies their active `WorkspaceMembership` for that specific workspace before issuing an updated session token.

### 2.2 Strict Database Predicates
Every Prisma query executed within the application layer must include `workspaceId`:
```typescript
// Example: Safe Query
await prisma.lead.findMany({
  where: {
    workspaceId: session.workspaceId,
    // other filters
  }
});
```

### 2.3 Cross-Workspace Foreign Key Validation
When creating or updating entities with relational foreign keys (e.g., a Lead referencing a `contactId` or `organizationId`, or a Deal referencing a `stageId`), the service layer verifies that referenced entities belong to the caller's active workspace:
```typescript
if (input.contactId) {
  const contact = await prisma.contact.findFirst({
    where: { id: input.contactId, workspaceId: session.workspaceId }
  });
  if (!contact) {
    throw new ValidationError("Referenced contact does not belong to active workspace.");
  }
}
```

### 2.4 Prevention of Cross-Workspace Leaks in Search and Analytics
- **Global Search**: Queries use `AND: [{ workspaceId: session.workspaceId }]` across all searched tables.
- **Dashboard & Reports**: All aggregation calculations (`SUM`, `COUNT`, `AVG`) include `workspaceId: session.workspaceId`.
- **Duplicate Detection**: The duplicate candidate scanner strictly evaluates candidates within `workspaceId`. It is physically impossible to merge an entity from Workspace A into Workspace B.
- **CSV Import & Export**: Exports are filtered by `session.workspaceId`. Imports force all newly created records to `session.workspaceId`.
- **Audit Logs**: Every audit log record carries the `workspaceId` of the workspace where the event transpired.

---

## 3. Automated Isolation Verification Matrix
Automated test suites verify the following invariants:
1. `GET /api/organizations` from Workspace A never returns Workspace B records.
2. Direct ID lookups (IDOR attempts) for Workspace B records using a Workspace A session return 404/403.
3. Mutations (update, delete) on Workspace B IDs with a Workspace A session are rejected.
4. Lead conversion targeting a stage belonging to Workspace B fails with a validation error.
5. Duplicate merge cannot pair an entity from Workspace A with an entity from Workspace B.
