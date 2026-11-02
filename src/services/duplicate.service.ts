import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";
import { Role, DuplicateEntityType, DuplicateStatus } from "@prisma/client";
import { DuplicateMergeSchema } from "@/lib/validators";

export async function scanForDuplicates(workspaceId: string) {
  // 1. Scan Contact duplicates by Email
  const contacts = await prisma.contact.findMany({
    where: { workspaceId, email: { not: null } },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true },
  });

  const emailMap = new Map<string, typeof contacts[0][]>();
  for (const c of contacts) {
    if (!c.email) continue;
    const norm = c.email.toLowerCase().trim();
    const list = emailMap.get(norm) || [];
    list.push(c);
    emailMap.set(norm, list);
  }

  for (const [email, list] of emailMap.entries()) {
    if (list.length > 1) {
      const primary = list[0];
      for (let i = 1; i < list.length; i++) {
        const dup = list[i];
        const existing = await prisma.duplicateCandidate.findFirst({
          where: {
            workspaceId,
            primaryRecordId: primary.id,
            duplicateRecordId: dup.id,
          },
        });
        if (!existing) {
          await prisma.duplicateCandidate.create({
            data: {
              workspaceId,
              entityType: DuplicateEntityType.CONTACT,
              primaryRecordId: primary.id,
              duplicateRecordId: dup.id,
              matchReason: `Matching email address: ${email}`,
              confidenceScore: 95,
              status: DuplicateStatus.PENDING,
            },
          });
        }
      }
    }
  }

  // 2. Scan Organization duplicates by Name or Website
  const orgs = await prisma.organization.findMany({
    where: { workspaceId },
    select: { id: true, name: true, website: true },
  });

  const nameMap = new Map<string, typeof orgs[0][]>();
  for (const o of orgs) {
    const norm = o.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!norm) continue;
    const list = nameMap.get(norm) || [];
    list.push(o);
    nameMap.set(norm, list);
  }

  for (const [name, list] of nameMap.entries()) {
    if (list.length > 1) {
      const primary = list[0];
      for (let i = 1; i < list.length; i++) {
        const dup = list[i];
        const existing = await prisma.duplicateCandidate.findFirst({
          where: {
            workspaceId,
            primaryRecordId: primary.id,
            duplicateRecordId: dup.id,
          },
        });
        if (!existing) {
          await prisma.duplicateCandidate.create({
            data: {
              workspaceId,
              entityType: DuplicateEntityType.ORGANIZATION,
              primaryRecordId: primary.id,
              duplicateRecordId: dup.id,
              matchReason: `Normalized company name match: ${primary.name} / ${dup.name}`,
              confidenceScore: 90,
              status: DuplicateStatus.PENDING,
            },
          });
        }
      }
    }
  }

  return { scannedContacts: contacts.length, scannedOrgs: orgs.length };
}

export async function listDuplicateCandidates(workspaceId: string, status?: DuplicateStatus) {
  const candidates = await prisma.duplicateCandidate.findMany({
    where: {
      workspaceId,
      status: status || DuplicateStatus.PENDING,
    },
    orderBy: { confidenceScore: "desc" },
    include: {
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  // Hydrate record previews
  const hydrated = await Promise.all(
    candidates.map(async (c) => {
      let primaryRecord: any = null;
      let duplicateRecord: any = null;

      if (c.entityType === DuplicateEntityType.ORGANIZATION) {
        [primaryRecord, duplicateRecord] = await Promise.all([
          prisma.organization.findFirst({ where: { id: c.primaryRecordId, workspaceId } }),
          prisma.organization.findFirst({ where: { id: c.duplicateRecordId, workspaceId } }),
        ]);
      } else {
        [primaryRecord, duplicateRecord] = await Promise.all([
          prisma.contact.findFirst({
            where: { id: c.primaryRecordId, workspaceId },
            include: { organization: true },
          }),
          prisma.contact.findFirst({
            where: { id: c.duplicateRecordId, workspaceId },
            include: { organization: true },
          }),
        ]);
      }

      return {
        ...c,
        primaryRecord,
        duplicateRecord,
      };
    })
  );

  return hydrated.filter((h) => h.primaryRecord && h.duplicateRecord);
}

export async function dismissDuplicateCandidate(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  candidateId: string;
}) {
  assertPermission(params.userRole, "MERGE_DUPLICATES");

  const candidate = await prisma.duplicateCandidate.findFirst({
    where: { id: params.candidateId, workspaceId: params.workspaceId },
  });
  if (!candidate) throw new Error("Candidate not found.");

  return prisma.duplicateCandidate.update({
    where: { id: params.candidateId },
    data: {
      status: DuplicateStatus.DISMISSED,
      reviewedById: params.userId,
      reviewedAt: new Date(),
    },
  });
}

export async function mergeDuplicateRecords(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  data: unknown;
}) {
  assertPermission(params.userRole, "MERGE_DUPLICATES");
  const parsed = DuplicateMergeSchema.parse(params.data);

  return prisma.$transaction(async (tx) => {
    // 1. Verify candidate
    const candidate = await tx.duplicateCandidate.findFirst({
      where: { id: parsed.candidateId, workspaceId: params.workspaceId },
    });
    if (!candidate) throw new Error("Duplicate candidate not found.");

    if (parsed.entityType === "ORGANIZATION") {
      const [primary, dup] = await Promise.all([
        tx.organization.findFirst({ where: { id: parsed.primaryRecordId, workspaceId: params.workspaceId } }),
        tx.organization.findFirst({ where: { id: parsed.duplicateRecordId, workspaceId: params.workspaceId } }),
      ]);
      if (!primary || !dup) throw new Error("Organizations not found in active workspace.");

      // Re-link dependent contacts
      await tx.contact.updateMany({
        where: { organizationId: dup.id, workspaceId: params.workspaceId },
        data: { organizationId: primary.id },
      });

      // Re-link leads
      await tx.lead.updateMany({
        where: { organizationId: dup.id, workspaceId: params.workspaceId },
        data: { organizationId: primary.id },
      });

      // Re-link deals
      await tx.deal.updateMany({
        where: { organizationId: dup.id, workspaceId: params.workspaceId },
        data: { organizationId: primary.id },
      });

      // Re-link activities
      await tx.activity.updateMany({
        where: { organizationId: dup.id, workspaceId: params.workspaceId },
        data: { organizationId: primary.id },
      });

      // Re-link tasks
      await tx.task.updateMany({
        where: { organizationId: dup.id, workspaceId: params.workspaceId },
        data: { organizationId: primary.id },
      });

      // Re-link research
      await tx.researchRecord.updateMany({
        where: { organizationId: dup.id, workspaceId: params.workspaceId },
        data: { organizationId: primary.id },
      });

      // Fill in empty fields in primary from dup
      const updates: any = {};
      if (!primary.website && dup.website) updates.website = dup.website;
      if (!primary.phone && dup.phone) updates.phone = dup.phone;
      if (!primary.email && dup.email) updates.email = dup.email;
      if (!primary.address && dup.address) updates.address = dup.address;
      if (!primary.description && dup.description) updates.description = dup.description;
      if (Object.keys(updates).length > 0) {
        await tx.organization.update({ where: { id: primary.id }, data: updates });
      }

      // Delete the duplicate org safely now that all dependencies moved
      await tx.organization.delete({ where: { id: dup.id } });

      // Update candidate status
      await tx.duplicateCandidate.update({
        where: { id: candidate.id },
        data: {
          status: DuplicateStatus.MERGED,
          reviewedById: params.userId,
          reviewedAt: new Date(),
        },
      });

      // Record Audit
      await tx.auditLog.create({
        data: {
          workspaceId: params.workspaceId,
          userId: params.userId,
          action: "ORGANIZATION_MERGED",
          entityType: "ORGANIZATION",
          entityId: primary.id,
          metadata: {
            primaryName: primary.name,
            mergedId: dup.id,
            mergedName: dup.name,
          },
        },
      });

      return { success: true, primaryId: primary.id };
    } else {
      // CONTACT MERGE
      const [primary, dup] = await Promise.all([
        tx.contact.findFirst({ where: { id: parsed.primaryRecordId, workspaceId: params.workspaceId } }),
        tx.contact.findFirst({ where: { id: parsed.duplicateRecordId, workspaceId: params.workspaceId } }),
      ]);
      if (!primary || !dup) throw new Error("Contacts not found in active workspace.");

      // Re-link leads
      await tx.lead.updateMany({
        where: { contactId: dup.id, workspaceId: params.workspaceId },
        data: { contactId: primary.id },
      });

      // Re-link deals
      await tx.deal.updateMany({
        where: { contactId: dup.id, workspaceId: params.workspaceId },
        data: { contactId: primary.id },
      });

      // Re-link activities
      await tx.activity.updateMany({
        where: { contactId: dup.id, workspaceId: params.workspaceId },
        data: { contactId: primary.id },
      });

      // Re-link tasks
      await tx.task.updateMany({
        where: { contactId: dup.id, workspaceId: params.workspaceId },
        data: { contactId: primary.id },
      });

      // Delete dup contact
      await tx.contact.delete({ where: { id: dup.id } });

      // Update candidate status
      await tx.duplicateCandidate.update({
        where: { id: candidate.id },
        data: {
          status: DuplicateStatus.MERGED,
          reviewedById: params.userId,
          reviewedAt: new Date(),
        },
      });

      // Record Audit
      await tx.auditLog.create({
        data: {
          workspaceId: params.workspaceId,
          userId: params.userId,
          action: "CONTACT_MERGED",
          entityType: "CONTACT",
          entityId: primary.id,
          metadata: {
            primaryName: `${primary.firstName} ${primary.lastName}`,
            mergedId: dup.id,
            mergedName: `${dup.firstName} ${dup.lastName}`,
          },
        },
      });

      return { success: true, primaryId: primary.id };
    }
  });
}
