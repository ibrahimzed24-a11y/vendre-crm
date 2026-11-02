import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";
import { Role } from "@prisma/client";
import { ContactInputSchema } from "@/lib/validators";

export async function listContacts(params: {
  workspaceId: string;
  query?: string;
  organizationId?: string;
  page?: number;
  limit?: number;
  sortBy?: "firstName" | "lastName" | "createdAt";
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
      { firstName: { contains: params.query, mode: "insensitive" } },
      { lastName: { contains: params.query, mode: "insensitive" } },
      { email: { contains: params.query, mode: "insensitive" } },
      { phone: { contains: params.query, mode: "insensitive" } },
      { jobTitle: { contains: params.query, mode: "insensitive" } },
    ];
  }

  if (params.organizationId) {
    where.organizationId = params.organizationId;
  }

  const [total, items] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [params.sortBy || "createdAt"]: params.sortOrder || "desc" },
      include: {
        organization: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            leads: true,
            deals: true,
          },
        },
      },
    }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getContactById(workspaceId: string, id: string) {
  return prisma.contact.findFirst({
    where: { id, workspaceId },
    include: {
      organization: true,
      owner: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
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

export async function createContact(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  data: unknown;
}) {
  assertPermission(params.userRole, "CREATE_RECORDS");
  const parsed = ContactInputSchema.parse(params.data);

  // Cross-workspace validation: organizationId must belong to active workspace
  if (parsed.organizationId) {
    const org = await prisma.organization.findFirst({
      where: { id: parsed.organizationId, workspaceId: params.workspaceId },
    });
    if (!org) {
      throw new Error("Specified organization does not belong to active workspace.");
    }
  }

  // Cross-workspace validation: ownerId must belong to active workspace
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

  const contact = await prisma.contact.create({
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
    action: "CONTACT_CREATED",
    entityType: "CONTACT",
    entityId: contact.id,
    metadata: { name: `${contact.firstName} ${contact.lastName}`, email: contact.email },
  });

  return contact;
}

export async function updateContact(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  id: string;
  data: unknown;
}) {
  assertPermission(params.userRole, "EDIT_RECORDS");
  const parsed = ContactInputSchema.partial().parse(params.data);

  const existing = await prisma.contact.findFirst({
    where: { id: params.id, workspaceId: params.workspaceId },
  });
  if (!existing) {
    throw new Error("Contact not found in active workspace.");
  }

  if (parsed.organizationId && parsed.organizationId !== existing.organizationId) {
    const org = await prisma.organization.findFirst({
      where: { id: parsed.organizationId, workspaceId: params.workspaceId },
    });
    if (!org) {
      throw new Error("Specified organization does not belong to active workspace.");
    }
  }

  if (parsed.ownerId && parsed.ownerId !== existing.ownerId) {
    assertPermission(params.userRole, "REASSIGN_OWNER");
  }

  const updated = await prisma.contact.update({
    where: { id: params.id },
    data: parsed,
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "CONTACT_UPDATED",
    entityType: "CONTACT",
    entityId: updated.id,
    metadata: { name: `${updated.firstName} ${updated.lastName}` },
  });

  return updated;
}

export async function deleteContact(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  id: string;
}) {
  assertPermission(params.userRole, "DELETE_RECORDS");

  const existing = await prisma.contact.findFirst({
    where: { id: params.id, workspaceId: params.workspaceId },
    include: {
      _count: {
        select: { deals: true },
      },
    },
  });

  if (!existing) {
    throw new Error("Contact not found in active workspace.");
  }

  if (existing._count.deals > 0) {
    throw new Error(
      `Cannot delete contact with ${existing._count.deals} active deal(s). Please reassign deals first.`
    );
  }

  await prisma.contact.delete({
    where: { id: params.id },
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "CONTACT_DELETED",
    entityType: "CONTACT",
    entityId: params.id,
    metadata: { name: `${existing.firstName} ${existing.lastName}` },
  });

  return { success: true };
}
