import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";
import { Role, ActivityType } from "@prisma/client";
import { ActivityInputSchema } from "@/lib/validators";

export async function listActivities(params: {
  workspaceId: string;
  type?: ActivityType;
  organizationId?: string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
  authorId?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = {
    workspaceId: params.workspaceId,
  };

  if (params.type) where.type = params.type;
  if (params.organizationId) where.organizationId = params.organizationId;
  if (params.contactId) where.contactId = params.contactId;
  if (params.leadId) where.leadId = params.leadId;
  if (params.dealId) where.dealId = params.dealId;
  if (params.authorId) where.authorId = params.authorId;

  const [total, items] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: "desc" },
      include: {
        author: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, title: true } },
        deal: { select: { id: true, title: true } },
      },
    }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createActivity(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  data: unknown;
}) {
  assertPermission(params.userRole, "CREATE_RECORDS");
  const parsed = ActivityInputSchema.parse(params.data);

  // Validate cross-workspace boundaries for any linked records
  if (parsed.organizationId) {
    const org = await prisma.organization.findFirst({
      where: { id: parsed.organizationId, workspaceId: params.workspaceId },
    });
    if (!org) throw new Error("Linked organization does not belong to active workspace.");
  }
  if (parsed.contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: parsed.contactId, workspaceId: params.workspaceId },
    });
    if (!contact) throw new Error("Linked contact does not belong to active workspace.");
  }
  if (parsed.leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: parsed.leadId, workspaceId: params.workspaceId },
    });
    if (!lead) throw new Error("Linked lead does not belong to active workspace.");
  }
  if (parsed.dealId) {
    const deal = await prisma.deal.findFirst({
      where: { id: parsed.dealId, workspaceId: params.workspaceId },
    });
    if (!deal) throw new Error("Linked deal does not belong to active workspace.");
  }

  const activity = await prisma.activity.create({
    data: {
      workspaceId: params.workspaceId,
      type: parsed.type,
      subject: parsed.subject,
      description: parsed.description,
      outcome: parsed.outcome,
      date: new Date(parsed.date),
      organizationId: parsed.organizationId,
      contactId: parsed.contactId,
      leadId: parsed.leadId,
      dealId: parsed.dealId,
      authorId: params.userId, // Server-derived
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "ACTIVITY_LOGGED",
    entityType: "ACTIVITY",
    entityId: activity.id,
    metadata: { subject: activity.subject, type: activity.type },
  });

  return activity;
}

export async function deleteActivity(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  id: string;
}) {
  assertPermission(params.userRole, "DELETE_RECORDS");

  const existing = await prisma.activity.findFirst({
    where: { id: params.id, workspaceId: params.workspaceId },
  });
  if (!existing) {
    throw new Error("Activity not found in active workspace.");
  }

  await prisma.activity.delete({
    where: { id: params.id },
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "ACTIVITY_DELETED",
    entityType: "ACTIVITY",
    entityId: params.id,
    metadata: { subject: existing.subject },
  });

  return { success: true };
}
