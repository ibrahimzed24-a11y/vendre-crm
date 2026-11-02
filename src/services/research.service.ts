import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";
import { Role, ResearchCategory } from "@prisma/client";
import { ResearchInputSchema } from "@/lib/validators";

export async function listResearch(params: {
  workspaceId: string;
  category?: ResearchCategory;
  organizationId?: string;
  contactId?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = {
    workspaceId: params.workspaceId,
  };

  if (params.category) where.category = params.category;
  if (params.organizationId) where.organizationId = params.organizationId;
  if (params.contactId) where.contactId = params.contactId;

  const [total, items] = await Promise.all([
    prisma.researchRecord.count({ where }),
    prisma.researchRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createResearch(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  data: unknown;
}) {
  assertPermission(params.userRole, "CREATE_RECORDS");
  const parsed = ResearchInputSchema.parse(params.data);

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

  const record = await prisma.researchRecord.create({
    data: {
      workspaceId: params.workspaceId,
      title: parsed.title,
      category: parsed.category,
      description: parsed.description,
      sourceUrl: parsed.sourceUrl,
      organizationId: parsed.organizationId,
      contactId: parsed.contactId,
      authorId: params.userId,
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "RESEARCH_RECORDED",
    entityType: "RESEARCH",
    entityId: record.id,
    metadata: { title: record.title, category: record.category },
  });

  return record;
}

export async function deleteResearch(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  id: string;
}) {
  assertPermission(params.userRole, "DELETE_RECORDS");

  const existing = await prisma.researchRecord.findFirst({
    where: { id: params.id, workspaceId: params.workspaceId },
  });
  if (!existing) {
    throw new Error("Research record not found in active workspace.");
  }

  await prisma.researchRecord.delete({
    where: { id: params.id },
  });

  await logAuditEvent({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "RESEARCH_DELETED",
    entityType: "RESEARCH",
    entityId: params.id,
    metadata: { title: existing.title },
  });

  return { success: true };
}
