import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";
import { Role } from "@prisma/client";
import { OrganizationInputSchema } from "@/lib/validators";

export async function listOrganizations(params: {
  workspaceId: string;
  query?: string;
  industry?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = {
    workspaceId: params.workspaceId,
  };

  if (params.query) {
    where.OR = [
      { name: { contains: params.query, mode: "insensitive" } },
      { city: { contains: params.query, mode: "insensitive" } },
      { country: { contains: params.query, mode: "insensitive" } },
      { email: { contains: params.query, mode: "insensitive" } },
    ];
  }

  if (params.industry) {
    where.industry = params.industry;
  }

  const [total, items] = await Promise.all([
    prisma.organization.count({ where }),
    prisma.organization.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [params.sortBy || "createdAt"]: params.sortOrder || "desc" },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            contacts: true,
            leads: true,
            deals: true,
          },
        },
      },
    }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getOrganizationById(workspaceId: string, id: string) {
  return prisma.organization.findFirst({
    where: { id, workspaceId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      contacts: {
        orderBy: { createdAt: "desc" },
      },
      leads: {
        orderBy: { createdAt: "desc" },
        include: { owner: { select: { id: true, name: true } } },
      },
      deals: {
        orderBy: { createdAt: "desc" },
        include: {
          stage: true,
          owner: { select: { id: true, name: true } },
        },
      },
      activities: {
        orderBy: { date: "desc" },
        include: { author: { select: { id: true, name: true } } },
      },
      tasks: {
        orderBy: { dueDate: "asc" },
        include: { assignedUser: { select: { id: true, name: true } } },
      },
      researchRecords: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function createOrganization(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  data: unknown;
}) {
  assertPermission(params.userRole, "CREATE_RECORDS");
  const parsed = OrganizationInputSchema.parse(params.data);

  // Validate ownerId belongs to workspace if provided
  if (parsed.ownerId) {
    const membership = await prisma.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: {
          userId: parsed.ownerId,
          workspaceId: params.workspaceId,
        },
      },
    });
    if (!membership) {
      throw new Error("Specified owner does not belong to active workspace.");
    }
  }

  const organization = await prisma.organization.create({
    data: {
      ...parsed,
      workspaceId: params.workspaceId,
      createdById: params.userId,
      ownerId: parsed.ownerId || params.userId,
    },
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "ORGANIZATION_CREATED",
    entityType: "ORGANIZATION",
    entityId: organization.id,
    metadata: { name: organization.name },
  });

  return organization;
}

export async function updateOrganization(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  id: string;
  data: unknown;
}) {
  assertPermission(params.userRole, "EDIT_RECORDS");
  const parsed = OrganizationInputSchema.partial().parse(params.data);

  const existing = await prisma.organization.findFirst({
    where: { id: params.id, workspaceId: params.workspaceId },
  });
  if (!existing) {
    throw new Error("Organization not found in active workspace.");
  }

  // Owner reassignment requires REASSIGN_OWNER permission
  if (parsed.ownerId && parsed.ownerId !== existing.ownerId) {
    assertPermission(params.userRole, "REASSIGN_OWNER");
  }

  const updated = await prisma.organization.update({
    where: { id: params.id },
    data: parsed,
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "ORGANIZATION_UPDATED",
    entityType: "ORGANIZATION",
    entityId: updated.id,
    metadata: { name: updated.name },
  });

  return updated;
}

export async function deleteOrganization(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  id: string;
}) {
  assertPermission(params.userRole, "DELETE_RECORDS");

  const existing = await prisma.organization.findFirst({
    where: { id: params.id, workspaceId: params.workspaceId },
    include: {
      _count: {
        select: { leads: true, deals: true },
      },
    },
  });

  if (!existing) {
    throw new Error("Organization not found in active workspace.");
  }

  // Safe deletion policy: prevent deletion if active deals exist
  if (existing._count.deals > 0 || existing._count.leads > 0) {
    throw new Error(
      `Cannot delete organization with ${existing._count.deals} linked deal(s) and ${existing._count.leads} linked lead(s). Please reassign or remove dependent records first.`
    );
  }

  await prisma.organization.delete({
    where: { id: params.id },
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "ORGANIZATION_DELETED",
    entityType: "ORGANIZATION",
    entityId: params.id,
    metadata: { name: existing.name },
  });

  return { success: true };
}
