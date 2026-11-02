import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";
import { Role, TaskStatus, Priority } from "@prisma/client";
import { TaskInputSchema } from "@/lib/validators";

export async function listTasks(params: {
  workspaceId: string;
  userId?: string;
  assignedUserId?: string;
  status?: TaskStatus;
  priority?: Priority;
  overdueOnly?: boolean;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = {
    workspaceId: params.workspaceId,
  };

  if (params.assignedUserId) {
    where.assignedUserId = params.assignedUserId;
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.priority) {
    where.priority = params.priority;
  }

  if (params.overdueOnly) {
    where.dueDate = { lt: new Date() };
    where.status = { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] };
  }

  const [total, items] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      include: {
        assignedUser: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, title: true } },
        deal: { select: { id: true, title: true } },
      },
    }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createTask(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  data: unknown;
}) {
  assertPermission(params.userRole, "CREATE_RECORDS");
  const parsed = TaskInputSchema.parse(params.data);

  // If assigning to another user, check ASSIGN_TASK_OTHERS permission
  if (parsed.assignedUserId && parsed.assignedUserId !== params.userId) {
    assertPermission(params.userRole, "ASSIGN_TASK_OTHERS");

    // Verify assigned user is an active member of this workspace
    const targetMembership = await prisma.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: {
          userId: parsed.assignedUserId,
          workspaceId: params.workspaceId,
        },
      },
    });
    if (!targetMembership) {
      throw new Error("Assigned user does not belong to active workspace.");
    }
  }

  // Cross-workspace validation for linked records
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

  const task = await prisma.task.create({
    data: {
      workspaceId: params.workspaceId,
      title: parsed.title,
      description: parsed.description,
      assignedUserId: parsed.assignedUserId || params.userId,
      createdById: params.userId,
      organizationId: parsed.organizationId,
      contactId: parsed.contactId,
      leadId: parsed.leadId,
      dealId: parsed.dealId,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      priority: parsed.priority,
      status: parsed.status,
    },
    include: {
      assignedUser: { select: { id: true, name: true } },
    },
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "TASK_CREATED",
    entityType: "TASK",
    entityId: task.id,
    metadata: { title: task.title, assignedTo: task.assignedUserId },
  });

  return task;
}

export async function updateTask(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  id: string;
  data: unknown;
}) {
  assertPermission(params.userRole, "EDIT_RECORDS");
  const parsed = TaskInputSchema.partial().parse(params.data);

  const existing = await prisma.task.findFirst({
    where: { id: params.id, workspaceId: params.workspaceId },
  });
  if (!existing) {
    throw new Error("Task not found in active workspace.");
  }

  if (parsed.assignedUserId && parsed.assignedUserId !== existing.assignedUserId) {
    assertPermission(params.userRole, "ASSIGN_TASK_OTHERS");
  }

  const updateData: any = { ...parsed };
  if (parsed.dueDate !== undefined) {
    updateData.dueDate = parsed.dueDate ? new Date(parsed.dueDate) : null;
  }

  if (parsed.status === TaskStatus.COMPLETED && existing.status !== TaskStatus.COMPLETED) {
    updateData.completedAt = new Date();
  } else if (parsed.status && parsed.status !== TaskStatus.COMPLETED) {
    updateData.completedAt = null;
  }

  const updated = await prisma.task.update({
    where: { id: params.id },
    data: updateData,
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "TASK_UPDATED",
    entityType: "TASK",
    entityId: updated.id,
    metadata: { title: updated.title, status: updated.status },
  });

  return updated;
}

export async function deleteTask(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  id: string;
}) {
  assertPermission(params.userRole, "DELETE_RECORDS");

  const existing = await prisma.task.findFirst({
    where: { id: params.id, workspaceId: params.workspaceId },
  });
  if (!existing) {
    throw new Error("Task not found in active workspace.");
  }

  await prisma.task.delete({
    where: { id: params.id },
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "TASK_DELETED",
    entityType: "TASK",
    entityId: params.id,
    metadata: { title: existing.title },
  });

  return { success: true };
}
