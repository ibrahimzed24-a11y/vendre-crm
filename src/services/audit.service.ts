import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import { Role } from "@prisma/client";

export async function listAuditLogs(params: {
  workspaceId: string;
  userRole: Role;
  action?: string;
  entityType?: string;
  userId?: string;
  page?: number;
  limit?: number;
}) {
  assertPermission(params.userRole, "VIEW_AUDIT_LOGS");

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 25));
  const skip = (page - 1) * limit;

  const where: any = {
    workspaceId: params.workspaceId,
  };

  if (params.action) where.action = params.action;
  if (params.entityType) where.entityType = params.entityType;
  if (params.userId) where.userId = params.userId;

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}
