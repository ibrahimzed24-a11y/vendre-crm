# VENDRE — Security Model Documentation

## 1. Principles

1. **Zero-Trust Workspace Boundary**: Access to any data point requires positive verification of active workspace membership. Client-provided workspace identifiers are strictly ignored.
2. **Defense in Depth**: Authorization is enforced at the network cookie/session layer, server action/API handler layer, service layer, and database query predicate layer.
3. **No Public Registration**: All user creation is managed exclusively by authorized Workspace Owners or via explicit bootstrap seed credentials.
4. **Principle of Least Privilege**: Users are restricted according to their specific RBAC assignment (`OWNER`, `ADMIN`, `MANAGER`, `SALES`, `VIEW_ONLY`).
5. **Data Protection & Sanitization**: Strict input validation using Zod schemas, parameterized database queries via Prisma, and CSV formula injection neutralization.
6. **Immutable Audit Trails**: High-value mutations (conversions, reassignments, deletes, imports, merges) are permanently recorded in the `AuditLog` table.

---

## 2. Authentication Architecture

```
User Browser                       Next.js Server                       PostgreSQL
     │                                   │                                  │
     │ 1. POST /api/auth/login           │                                  │
     │    { email, password }            │                                  │
     ├──────────────────────────────────►│                                  │
     │                                   │ 2. Query user & memberships      │
     │                                   ├─────────────────────────────────►│
     │                                   │ 3. Return user record            │
     │                                   │◄─────────────────────────────────┤
     │                                   │                                  │
     │                                   │ 4. Verify bcrypt hash            │
     │                                   │ 5. Create HMAC-signed JWT        │
     │ 6. Set-Cookie: vendre_session     │                                  │
     │    (HttpOnly, SameSite=Lax)       │                                  │
     │◄──────────────────────────────────┤                                  │
```

- **Password Storage**: Passwords are saved as bcrypt hashes using salt work factor >= 10.
- **Session Tokens**: Server-signed cryptographic session tokens containing `userId` and `activeWorkspaceId`.
- **Cookie Security**: Flags `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in production environments prevent XSS token theft.
- **Brute Force Defense**: Rate limiting on authentication endpoints stops automated credential attacks.

---

## 3. Authorization Policy Matrix

| Action / Capability | OWNER | ADMIN | MANAGER | SALES | VIEW ONLY |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Workspace Settings & Members** | Full | Read/Invite | Read | Denied | Denied |
| **Manage Pipeline Stages** | Yes | Yes | Denied | Denied | Denied |
| **View All Workspace Records** | Yes | Yes | Yes | Permitted / Assigned | Read Only |
| **Create Org / Contact / Lead / Deal**| Yes | Yes | Yes | Yes | Denied |
| **Edit Records** | Yes | Yes | Yes | Assigned only | Denied |
| **Convert Lead to Deal** | Yes | Yes | Yes | Yes | Denied |
| **Reassign Record Ownership** | Yes | Yes | Yes | Denied | Denied |
| **Delete Records** | Yes | Yes | Denied | Denied | Denied |
| **Log Activity & Create Tasks** | Yes | Yes | Yes | Yes | Denied |
| **Assign Task to Other Users** | Yes | Yes | Yes | Denied | Denied |
| **Merge Duplicates** | Yes | Yes | Yes | Denied | Denied |
| **CSV Import & Export** | Yes | Yes | Export Only | Export Only | Denied |
| **View Audit Logs** | Yes | Yes | Denied | Denied | Denied |

---

## 4. Input Validation & Formula Injection Neutralization

### 4.1 Zod Runtime Validation
Every API route and Server Action executes strict schema parsing before touching business logic:
- Type checks
- Format constraints (email, URL, phone numbers, ISO dates)
- Positive numeric ranges for monetary fields
- Allowed enum values

### 4.2 Formula Injection Defense (CSV)
When exporting data to CSV or reading incoming rows, any string beginning with characters:
`=`, `+`, `-`, `@`, `\t`, `\r`
is sanitized by prefixing a single quotation mark (`'`), neutralizing executable Excel/Sheets command macros (CSV Injection / CWE-1236).

### 4.3 IDOR Prevention
All entity lookups require matching both `id` AND `workspaceId`:
```typescript
const record = await prisma.deal.findFirst({
  where: {
    id: dealId,
    workspaceId: session.workspaceId, // Guarantees no IDOR cross-tenant access
  }
});
if (!record) throw new ForbiddenOrNotFoundException();
```
