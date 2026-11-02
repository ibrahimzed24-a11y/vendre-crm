import { Role } from "@prisma/client";

export type PermissionAction =
  | "READ_RECORDS"
  | "CREATE_RECORDS"
  | "EDIT_RECORDS"
  | "DELETE_RECORDS"
  | "CONVERT_LEAD"
  | "REASSIGN_OWNER"
  | "ASSIGN_TASK_OTHERS"
  | "MANAGE_STAGES"
  | "MANAGE_MEMBERS"
  | "IMPORT_DATA"
  | "EXPORT_DATA"
  | "MERGE_DUPLICATES"
  | "VIEW_AUDIT_LOGS"
  | "VIEW_REPORTS";

const ROLE_PERMISSIONS: Record<Role, PermissionAction[]> = {
  OWNER: [
    "READ_RECORDS",
    "CREATE_RECORDS",
    "EDIT_RECORDS",
    "DELETE_RECORDS",
    "CONVERT_LEAD",
    "REASSIGN_OWNER",
    "ASSIGN_TASK_OTHERS",
    "MANAGE_STAGES",
    "MANAGE_MEMBERS",
    "IMPORT_DATA",
    "EXPORT_DATA",
    "MERGE_DUPLICATES",
    "VIEW_AUDIT_LOGS",
    "VIEW_REPORTS",
  ],
  ADMIN: [
    "READ_RECORDS",
    "CREATE_RECORDS",
    "EDIT_RECORDS",
    "DELETE_RECORDS",
    "CONVERT_LEAD",
    "REASSIGN_OWNER",
    "ASSIGN_TASK_OTHERS",
    "MANAGE_STAGES",
    "MANAGE_MEMBERS",
    "IMPORT_DATA",
    "EXPORT_DATA",
    "MERGE_DUPLICATES",
    "VIEW_AUDIT_LOGS",
    "VIEW_REPORTS",
  ],
  MANAGER: [
    "READ_RECORDS",
    "CREATE_RECORDS",
    "EDIT_RECORDS",
    "CONVERT_LEAD",
    "REASSIGN_OWNER",
    "ASSIGN_TASK_OTHERS",
    "EXPORT_DATA",
    "MERGE_DUPLICATES",
    "VIEW_REPORTS",
  ],
  SALES: [
    "READ_RECORDS",
    "CREATE_RECORDS",
    "EDIT_RECORDS",
    "CONVERT_LEAD",
    "EXPORT_DATA",
    "VIEW_REPORTS",
  ],
  VIEW_ONLY: [
    "READ_RECORDS",
    "VIEW_REPORTS",
  ],
};

export function isActionAllowed(role: Role, action: PermissionAction): boolean {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(action);
}

export class ForbiddenError extends Error {
  constructor(message = "Unauthorized: insufficient permissions for this operation.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function assertPermission(role: Role, action: PermissionAction): void {
  if (!isActionAllowed(role, action)) {
    throw new ForbiddenError(
      `Permission denied: Role ${role} is not permitted to perform ${action}.`
    );
  }
}
