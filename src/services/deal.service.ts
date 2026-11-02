import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";
import { Role, DealStatus } from "@prisma/client";
import { DealInputSchema, DealStageMoveSchema } from "@/lib/validators";

export async function listDeals(params: {
  workspaceId: string;
  query?: string;
  stageId?: string;
  status?: DealStatus;
  ownerId?: string;
  organizationId?: string;
  page?: number;
  limit?: number;
  sortBy?: "title" | "value" | "createdAt" | "expectedCloseDate";
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
      { organization: { name: { contains: params.query, mode: "insensitive" } } },
      { contact: { firstName: { contains: params.query, mode: "insensitive" } } },
      { contact: { lastName: { contains: params.query, mode: "insensitive" } } },
    ];
  }

  if (params.stageId) where.stageId = params.stageId;
  if (params.status) where.status = params.status;
  if (params.ownerId) where.ownerId = params.ownerId;
  if (params.organizationId) where.organizationId = params.organizationId;

  const [total, items] = await Promise.all([
    prisma.deal.count({ where }),
    prisma.deal.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [params.sortBy || "createdAt"]: params.sortOrder || "desc" },
      include: {
        stage: true,
        organization: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        owner: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getDealById(workspaceId: string, id: string) {
  return prisma.deal.findFirst({
    where: { id, workspaceId },
    include: {
      stage: true,
      organization: true,
      contact: true,
      convertedFromLead: true,
      owner: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
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

export async function createDeal(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  data: unknown;
}) {
  assertPermission(params.userRole, "CREATE_RECORDS");
  const parsed = DealInputSchema.parse(params.data);

  // Validate stage belongs to active workspace
  const stage = await prisma.pipelineStage.findFirst({
    where: { id: parsed.stageId, workspaceId: params.workspaceId },
  });
  if (!stage) {
    throw new Error("Specified stage does not belong to active workspace.");
  }

  if (parsed.organizationId) {
    const org = await prisma.organization.findFirst({
      where: { id: parsed.organizationId, workspaceId: params.workspaceId },
    });
    if (!org) {
      throw new Error("Specified organization does not belong to active workspace.");
    }
  }

  if (parsed.contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: parsed.contactId, workspaceId: params.workspaceId },
    });
    if (!contact) {
      throw new Error("Specified contact does not belong to active workspace.");
    }
  }

  let finalStatus = parsed.status;
  let finalProb = parsed.probability;
  if (stage.isWon) {
    finalStatus = DealStatus.WON;
    finalProb = 100;
  } else if (stage.isLost) {
    finalStatus = DealStatus.LOST;
    finalProb = 0;
  }

  const deal = await prisma.deal.create({
    data: {
      ...parsed,
      status: finalStatus,
      probability: finalProb,
      expectedCloseDate: parsed.expectedCloseDate ? new Date(parsed.expectedCloseDate) : null,
      workspaceId: params.workspaceId,
      createdById: params.userId,
      ownerId: parsed.ownerId || params.userId,
    },
    include: { stage: true },
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "DEAL_CREATED",
    entityType: "DEAL",
    entityId: deal.id,
    metadata: { title: deal.title, value: deal.value, stageName: stage.name },
  });

  return deal;
}

export async function updateDeal(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  id: string;
  data: unknown;
}) {
  assertPermission(params.userRole, "EDIT_RECORDS");
  const parsed = DealInputSchema.partial().parse(params.data);

  const existing = await prisma.deal.findFirst({
    where: { id: params.id, workspaceId: params.workspaceId },
    include: { stage: true },
  });
  if (!existing) {
    throw new Error("Deal not found in active workspace.");
  }

  if (parsed.ownerId && parsed.ownerId !== existing.ownerId) {
    assertPermission(params.userRole, "REASSIGN_OWNER");
  }

  let updateData: any = { ...parsed };
  if (parsed.expectedCloseDate !== undefined) {
    updateData.expectedCloseDate = parsed.expectedCloseDate ? new Date(parsed.expectedCloseDate) : null;
  }

  if (parsed.stageId && parsed.stageId !== existing.stageId) {
    const newStage = await prisma.pipelineStage.findFirst({
      where: { id: parsed.stageId, workspaceId: params.workspaceId },
    });
    if (!newStage) {
      throw new Error("Target stage does not belong to active workspace.");
    }

    if (newStage.isWon) {
      updateData.status = DealStatus.WON;
      updateData.probability = 100;
    } else if (newStage.isLost) {
      updateData.status = DealStatus.LOST;
      updateData.probability = 0;
    } else {
      if (existing.status !== DealStatus.OPEN) {
        updateData.status = DealStatus.OPEN;
      }
    }
  }

  const updated = await prisma.deal.update({
    where: { id: params.id },
    data: updateData,
    include: { stage: true },
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "DEAL_UPDATED",
    entityType: "DEAL",
    entityId: updated.id,
    metadata: { title: updated.title, value: updated.value, stage: updated.stage.name },
  });

  return updated;
}

export async function moveDealStage(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  data: unknown;
}) {
  assertPermission(params.userRole, "EDIT_RECORDS");
  const parsed = DealStageMoveSchema.parse(params.data);

  const [deal, targetStage] = await Promise.all([
    prisma.deal.findFirst({
      where: { id: parsed.dealId, workspaceId: params.workspaceId },
      include: { stage: true },
    }),
    prisma.pipelineStage.findFirst({
      where: { id: parsed.destinationStageId, workspaceId: params.workspaceId },
    }),
  ]);

  if (!deal) {
    throw new Error("Deal not found in active workspace.");
  }
  if (!targetStage) {
    throw new Error("Destination stage not found in active workspace.");
  }

  let newStatus = deal.status;
  let newProb = deal.probability;
  if (targetStage.isWon) {
    newStatus = DealStatus.WON;
    newProb = 100;
  } else if (targetStage.isLost) {
    newStatus = DealStatus.LOST;
    newProb = 0;
  } else if (deal.status !== DealStatus.OPEN) {
    newStatus = DealStatus.OPEN;
    newProb = 50;
  }

  const updated = await prisma.deal.update({
    where: { id: deal.id },
    data: {
      stageId: targetStage.id,
      status: newStatus,
      probability: newProb,
    },
    include: { stage: true },
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "DEAL_STAGE_CHANGED",
    entityType: "DEAL",
    entityId: updated.id,
    metadata: {
      dealTitle: updated.title,
      fromStage: deal.stage.name,
      toStage: targetStage.name,
      status: updated.status,
    },
  });

  return updated;
}

export async function deleteDeal(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  id: string;
}) {
  assertPermission(params.userRole, "DELETE_RECORDS");

  const existing = await prisma.deal.findFirst({
    where: { id: params.id, workspaceId: params.workspaceId },
  });
  if (!existing) {
    throw new Error("Deal not found in active workspace.");
  }

  await prisma.deal.delete({
    where: { id: params.id },
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "DEAL_DELETED",
    entityType: "DEAL",
    entityId: params.id,
    metadata: { title: existing.title },
  });

  return { success: true };
}
