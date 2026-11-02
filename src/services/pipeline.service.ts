import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";
import { Role } from "@prisma/client";
import { PipelineStageInputSchema } from "@/lib/validators";

export async function getPipelineStages(workspaceId: string) {
  return prisma.pipelineStage.findMany({
    where: { workspaceId },
    orderBy: { displayOrder: "asc" },
  });
}

export async function getPipelineKanbanData(workspaceId: string) {
  const stages = await prisma.pipelineStage.findMany({
    where: { workspaceId },
    orderBy: { displayOrder: "asc" },
    include: {
      deals: {
        orderBy: { createdAt: "desc" },
        include: {
          organization: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          owner: { select: { id: true, name: true } },
        },
      },
    },
  });

  const formatted = stages.map((stage) => {
    const totalValue = stage.deals.reduce((sum, d) => sum + (d.value || 0), 0);
    return {
      ...stage,
      totalValue,
      dealCount: stage.deals.length,
    };
  });

  return formatted;
}

export async function createPipelineStage(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  data: unknown;
}) {
  assertPermission(params.userRole, "MANAGE_STAGES");
  const parsed = PipelineStageInputSchema.parse(params.data);

  // If stage is won and lost at same time, reject
  if (parsed.isWon && parsed.isLost) {
    throw new Error("A stage cannot be configured as both Won and Lost simultaneously.");
  }

  // Count existing stages to set displayOrder if needed
  const stageCount = await prisma.pipelineStage.count({
    where: { workspaceId: params.workspaceId },
  });

  const stage = await prisma.pipelineStage.create({
    data: {
      workspaceId: params.workspaceId,
      name: parsed.name,
      displayOrder: parsed.displayOrder || stageCount + 1,
      color: parsed.color,
      isWon: parsed.isWon,
      isLost: parsed.isLost,
    },
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "PIPELINE_STAGE_CREATED",
    entityType: "PIPELINE_STAGE",
    entityId: stage.id,
    metadata: { name: stage.name },
  });

  return stage;
}

export async function updatePipelineStage(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  id: string;
  data: unknown;
}) {
  assertPermission(params.userRole, "MANAGE_STAGES");
  const parsed = PipelineStageInputSchema.partial().parse(params.data);

  if (parsed.isWon && parsed.isLost) {
    throw new Error("A stage cannot be configured as both Won and Lost simultaneously.");
  }

  const existing = await prisma.pipelineStage.findFirst({
    where: { id: params.id, workspaceId: params.workspaceId },
  });
  if (!existing) {
    throw new Error("Pipeline stage not found in active workspace.");
  }

  const updated = await prisma.pipelineStage.update({
    where: { id: params.id },
    data: parsed,
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "PIPELINE_STAGE_UPDATED",
    entityType: "PIPELINE_STAGE",
    entityId: updated.id,
    metadata: { name: updated.name },
  });

  return updated;
}

export async function deletePipelineStage(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  id: string;
  reassignmentStageId?: string;
}) {
  assertPermission(params.userRole, "MANAGE_STAGES");

  const existing = await prisma.pipelineStage.findFirst({
    where: { id: params.id, workspaceId: params.workspaceId },
    include: {
      _count: {
        select: { deals: true },
      },
    },
  });

  if (!existing) {
    throw new Error("Pipeline stage not found in active workspace.");
  }

  return prisma.$transaction(async (tx) => {
    if (existing._count.deals > 0) {
      if (!params.reassignmentStageId) {
        throw new Error(
          `Cannot delete stage "${existing.name}" because it contains ${existing._count.deals} deal(s). Provide a target reassignment stage.`
        );
      }

      // Verify reassignment stage exists in the same workspace
      const target = await tx.pipelineStage.findFirst({
        where: { id: params.reassignmentStageId, workspaceId: params.workspaceId },
      });
      if (!target || target.id === existing.id) {
        throw new Error("Invalid reassignment stage in active workspace.");
      }

      // Reassign deals
      await tx.deal.updateMany({
        where: { stageId: existing.id, workspaceId: params.workspaceId },
        data: { stageId: target.id },
      });
    }

    await tx.pipelineStage.delete({
      where: { id: params.id },
    });

    await tx.auditLog.create({
      data: {
        workspaceId: params.workspaceId,
        userId: params.userId,
        action: "PIPELINE_STAGE_DELETED",
        entityType: "PIPELINE_STAGE",
        entityId: params.id,
        metadata: {
          name: existing.name,
          reassignedTo: params.reassignmentStageId || null,
        },
      },
    });

    return { success: true };
  });
}
