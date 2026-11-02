import { prisma } from "./prisma";

export interface LogAuditParams {
  workspaceId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logAuditEvent(params: LogAuditParams) {
  try {
    let sanitizedMetadata: Record<string, unknown> | undefined = undefined;
    if (params.metadata) {
      sanitizedMetadata = { ...params.metadata };
      // Strip any sensitive fields if accidentally included
      delete sanitizedMetadata.password;
      delete sanitizedMetadata.passwordHash;
      delete sanitizedMetadata.token;
      delete sanitizedMetadata.secret;
    }

    return await prisma.auditLog.create({
      data: {
        workspaceId: params.workspaceId,
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        metadata: sanitizedMetadata ? (sanitizedMetadata as any) : undefined,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
    // Non-blocking for primary transaction unless critical, but logs to console
  }
}
