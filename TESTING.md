# VENDRE — Testing Documentation

This document describes the automated and manual testing strategies implemented for the VENDRE platform.

---

## 1. Automated Test Suite Architecture

VENDRE uses **Vitest** for unit, integration, and security testing, connected to the local PostgreSQL database engine.

```bash
# Run the automated test suite
npm test
```

### Summary of Passing Test Suites

| Test Suite | File | Focus / Coverage |
| :--- | :--- | :--- |
| **Workspace Isolation** | `tests/workspace-isolation.test.ts` | Multi-tenancy isolation, cross-workspace IDOR defense, query leakage prevention, scoped search, scoped metrics, CSV scoping |
| **Role Permissions** | `tests/role-permissions.test.ts` | Server-side RBAC validation, View-Only mutation prevention, Sales administrative restriction, Audit Log access restrictions |
| **Lead Conversion** | `tests/lead-conversion.test.ts` | Database transaction atomicity, cross-workspace stage rejection, rollback verification, deal creation, audit emission |
| **CSV Sanitization** | `tests/csv-sanitization.test.ts` | Neutralization of formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`), CSV formatting, RFC parser compliance |
| **Duplicate Merging** | `tests/duplicate-merge.test.ts` | Duplicate scanning, relationship re-linking, transactional merge, duplicate removal, audit logging |

---

## 2. Test Execution Results

Actual test runner output from Vitest:

```text
 ✓ tests/csv-sanitization.test.ts (5 tests)
 ✓ tests/lead-conversion.test.ts (3 tests)
 ✓ tests/duplicate-merge.test.ts (1 test)
 ✓ tests/role-permissions.test.ts (7 tests)
 ✓ tests/workspace-isolation.test.ts (8 tests)

 Test Files  5 passed (5)
      Tests  24 passed (24)
   Duration  1.99s
```

---

## 3. Manual Browser Verification Checklist

1. **Authentication Flow**:
   - Access `http://localhost:3000/` without cookies ➔ Automatically redirected to `/login` (HTTP 307).
   - Click "Owner" demo button ➔ Inputs filled with `owner@vendre.com` / `Vendre2025!`.
   - Click "Sign In" ➔ Successfully logs in and lands on Executive Dashboard.
2. **Workspace Switcher**:
   - Click workspace dropdown in header ➔ Displays "VENDRE Sales" and "Agency Sales".
   - Click "Agency Sales" ➔ Screen reloads into Agency Sales context.
   - Verify metrics, contacts, deals, and activity feed show only Agency Sales data.
   - Switch back to "VENDRE Sales" ➔ Restores VENDRE Sales records.
3. **Organizations**:
   - Navigate to `/organizations`.
   - Click "Add Organization" ➔ Submit new organization modal.
   - View newly created organization in table.
   - Click organization name ➔ Inspects detail view with tabs for Contacts, Leads, Deals, Activities, Tasks, Research.
4. **Contacts**:
   - Navigate to `/contacts`.
   - Search contacts using search bar ➔ Real-time filter responds smoothly.
   - Click "Add Contact" ➔ Select organization and submit.
5. **Leads & Transactional Conversion**:
   - Navigate to `/leads`.
   - Filter leads by status tabs (`New`, `Contacted`, `Qualified`).
   - Click "Convert" button on a qualified lead ➔ `LeadConvertModal` opens.
   - Confirm deal title, pipeline stage, and value ➔ Submit conversion.
   - Verify lead status changes to `CONVERTED` and deal appears in `/deals` and `/pipeline`.
6. **Pipeline Kanban**:
   - Navigate to `/pipeline`.
   - Move deal between stages using the "Next" and "Prev" stage buttons.
   - Verify stage counter and stage values recalculate immediately.
7. **Global Search**:
   - Press `Cmd+K` or click search bar in header.
   - Type "Apex" or "Nordic".
   - Select search result ➔ Instantly navigates to detail page.
8. **CSV Export & Import**:
   - Click "Export CSV" on `/organizations` ➔ Downloads `.csv` file.
   - Verify formula injection characters are neutralized with single quotes.
   - Click "Import CSV" ➔ Upload sample CSV file ➔ Validates rows and imports batch.
9. **Audit Logs**:
   - Navigate to `/audit-logs`.
   - Confirm that the recent login, conversions, and creation events are recorded with user ID and metadata.
