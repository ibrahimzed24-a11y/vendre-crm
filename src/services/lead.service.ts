import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";
import { Role, LeadStatus, Priority } from "@prisma/client";
import { LeadInputSchema, LeadConvertSchema } from "@/lib/validators";

export async function listLeads(params: {
  workspaceId: string;
  query?: string;
  status?: LeadStatus;
  priority?: Priority;
  ownerId?: string;
  page?: number;
  limit?: number;
  sortBy?: "title" | "estimatedValue" | "createdAt" | "expectedCloseDate";
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
      { title: { contains: params.query, mode: "insensitive" } },
      { description: { contains: params.query, mode: "insensitive" } },
      { contact: { firstName: { contains: params.query, mode: "insensitive" } } },
      { contact: { lastName: { contains: params.query, mode: "insensitive" } } },
      { organization: { name: { contains: params.query, mode: "insensitive" } } },
    ];
  }

  if (params.status) where.status = params.status;
  if (params.priority) where.priority = params.priority;
  if (params.ownerId) where.ownerId = params.ownerId;

  const [total, items] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [params.sortBy || "createdAt"]: params.sortOrder || "desc" },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        organization: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getLeadById(workspaceId: string, id: string) {
  return prisma.lead.findFirst({
    where: { id, workspaceId },
    include: {
      contact: true,
      organization: true,
      owner: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      convertedDeal: {
        include: { stage: true },
      },
      activities: {
        orderBy: { date: "desc" },
        include: { author: { select: { id: true, name: true } } },
      },
      tasks: {
        orderBy: { dueDate: "asc" },
        include: { assignedUser: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function createLead(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  data: unknown;
}) {
  assertPermission(params.userRole, "CREATE_RECORDS");
  const parsed = LeadInputSchema.parse(params.data);

  // Validate contact belongs to active workspace
  if (parsed.contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: parsed.contactId, workspaceId: params.workspaceId },
    });
    if (!contact) {
      throw new Error("Specified contact does not belong to active workspace.");
    }
  }

  // Validate organization belongs to active workspace
  if (parsed.organizationId) {
    const org = await prisma.organization.findFirst({
      where: { id: parsed.organizationId, workspaceId: params.workspaceId },
    });
    if (!org) {
      throw new Error("Specified organization does not belong to active workspace.");
    }
  }

  const lead = await prisma.lead.create({
    data: {
      ...parsed,
      expectedCloseDate: parsed.expectedCloseDate ? new Date(parsed.expectedCloseDate) : null,
      nextFollowUp: parsed.nextFollowUp ? new Date(parsed.nextFollowUp) : null,
      workspaceId: params.workspaceId,
      createdById: params.userId,
      ownerId: parsed.ownerId || params.userId,
    },
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "LEAD_CREATED",
    entityType: "LEAD",
    entityId: lead.id,
    metadata: { title: lead.title, estimatedValue: lead.estimatedValue },
  });

  return lead;
}

export async function updateLead(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  id: string;
  data: unknown;
}) {
  assertPermission(params.userRole, "EDIT_RECORDS");
  const parsed = LeadInputSchema.partial().parse(params.data);

  const existing = await prisma.lead.findFirst({
    where: { id: params.id, workspaceId: params.workspaceId },
  });
  if (!existing) {
    throw new Error("Lead not found in active workspace.");
  }

  if (parsed.contactId && parsed.contactId !== existing.contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: parsed.contactId, workspaceId: params.workspaceId },
    });
    if (!contact) {
      throw new Error("Specified contact does not belong to active workspace.");
    }
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

  const updated = await prisma.lead.update({
    where: { id: params.id },
    data: {
      ...parsed,
      expectedCloseDate: parsed.expectedCloseDate !== undefined
        ? parsed.expectedCloseDate ? new Date(parsed.expectedCloseDate) : null
        : undefined,
      nextFollowUp: parsed.nextFollowUp !== undefined
        ? parsed.nextFollowUp ? new Date(parsed.nextFollowUp) : null
        : undefined,
    },
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "LEAD_UPDATED",
    entityType: "LEAD",
    entityId: updated.id,
    metadata: { title: updated.title, status: updated.status },
  });

  return updated;
}

export async function deleteLead(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  id: string;
}) {
  assertPermission(params.userRole, "DELETE_RECORDS");

  const existing = await prisma.lead.findFirst({
    where: { id: params.id, workspaceId: params.workspaceId },
  });
  if (!existing) {
    throw new Error("Lead not found in active workspace.");
  }

  if (existing.status === LeadStatus.CONVERTED) {
    throw new Error("Cannot delete a converted lead. The linked deal must be reviewed.");
  }

  await prisma.lead.delete({
    where: { id: params.id },
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "LEAD_DELETED",
    entityType: "LEAD",
    entityId: params.id,
    metadata: { title: existing.title },
  });

  return { success: true };
}

/**
 * Atomic Transactional Lead Conversion to Deal
 */
export async function convertLeadToDeal(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  data: unknown;
}) {
  assertPermission(params.userRole, "CONVERT_LEAD");
  const parsed = LeadConvertSchema.parse(params.data);

  return prisma.$transaction(async (tx) => {
    // 1. Verify lead exists and belongs to active workspace
    const lead = await tx.lead.findFirst({
      where: { id: parsed.leadId, workspaceId: params.workspaceId },
    });

    if (!lead) {
      throw new Error("Lead not found in active workspace.");
    }

    if (lead.status === LeadStatus.CONVERTED) {
      throw new Error("Lead has already been converted.");
    }

    // 2. Verify destination pipeline stage belongs to active workspace
    const stage = await tx.pipelineStage.findFirst({
      where: { id: parsed.stageId, workspaceId: params.workspaceId },
    });

    if (!stage) {
      throw new Error("Destination pipeline stage does not belong to active workspace.");
    }

    // 3. Create the new Deal
    const deal = await tx.deal.create({
      data: {
        workspaceId: params.workspaceId,
        title: parsed.dealTitle,
        stageId: stage.id,
        organizationId: lead.organizationId,
        contactId: lead.contactId,
        leadId: lead.id,
        value: parsed.value,
        currency: parsed.currency || "USD",
        probability: stage.isWon ? 100 : stage.isLost ? 0 : 50,
        expectedCloseDate: parsed.expectedCloseDate ? new Date(parsed.expectedCloseDate) : null,
        ownerId: parsed.ownerId || lead.ownerId || params.userId,
        createdById: params.userId,
      },
    });

    // 4. Update the Lead status to CONVERTED and link to new Deal
    const updatedLead = await tx.lead.update({
      where: { id: lead.id },
      data: {
        status: LeadStatus.CONVERTED,
        convertedDealId: deal.id,
      },
    });

    // 5. Re-link activities and tasks to the new deal
    await tx.activity.updateMany({
      where: { leadId: lead.id, workspaceId: params.workspaceId },
      data: { dealId: deal.id },
    });

    await tx.task.updateMany({
      where: { leadId: lead.id, workspaceId: params.workspaceId },
      data: { dealId: deal.id },
    });

    // 6. Record Audit Log inside the transaction
    await tx.auditLog.create({
      data: {
        workspaceId: params.workspaceId,
        userId: params.userId,
        action: "LEAD_CONVERTED",
        entityType: "LEAD",
        entityId: lead.id,
        metadata: {
          leadTitle: lead.title,
          dealId: deal.id,
          dealTitle: deal.title,
          value: deal.value,
          stageName: stage.name,
        },
      },
    });

    return { lead: updatedLead, deal };
  });
}
