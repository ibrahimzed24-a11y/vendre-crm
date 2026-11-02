import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { scanForDuplicates, mergeDuplicateRecords } from "../src/services/duplicate.service";
import { Role, DuplicateEntityType, DuplicateStatus } from "@prisma/client";

describe("Duplicate Detection and Transactional Merge", () => {
  let wsVendre: any;
  let userAdmin: any;
  let orgPrimary: any;
  let orgDuplicate: any;
  let contactRecord: any;
  let candidate: any;

  beforeAll(async () => {
    wsVendre = await prisma.workspace.findUniqueOrThrow({ where: { slug: "vendre-sales" } });
    userAdmin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@vendre.com" } });

    // Clean any previous test artifacts
    await prisma.contact.deleteMany({ where: { firstName: "Sarah", lastName: "Connor" } });
    await prisma.organization.deleteMany({ where: { name: { startsWith: "OmniCorp Global" } } });

    // Create 2 duplicate organizations
    orgPrimary = await prisma.organization.create({
      data: {
        workspaceId: wsVendre.id,
        name: "OmniCorp Global Inc",
        website: "https://omnicorp.example.com",
        createdById: userAdmin.id,
      },
    });

    orgDuplicate = await prisma.organization.create({
      data: {
        workspaceId: wsVendre.id,
        name: "OmniCorp Global, Inc.", // Similar name
        phone: "+1 800 555 9999",
        createdById: userAdmin.id,
      },
    });

    // Attach a contact to the duplicate organization
    contactRecord = await prisma.contact.create({
      data: {
        workspaceId: wsVendre.id,
        organizationId: orgDuplicate.id,
        firstName: "Sarah",
        lastName: "Connor",
        createdById: userAdmin.id,
      },
    });

    // Create duplicate candidate record
    candidate = await prisma.duplicateCandidate.create({
      data: {
        workspaceId: wsVendre.id,
        entityType: DuplicateEntityType.ORGANIZATION,
        primaryRecordId: orgPrimary.id,
        duplicateRecordId: orgDuplicate.id,
        matchReason: "Normalized company name match",
        confidenceScore: 92,
        status: DuplicateStatus.PENDING,
      },
    });
  });

  afterAll(async () => {
    if (candidate) await prisma.duplicateCandidate.deleteMany({ where: { id: candidate.id } });
    if (contactRecord) await prisma.contact.deleteMany({ where: { id: contactRecord.id } });
    if (orgPrimary) await prisma.organization.deleteMany({ where: { id: orgPrimary.id } });
  });

  it("Executes transactional merge: re-links dependent contacts to primary and removes duplicate org", async () => {
    const result = await mergeDuplicateRecords({
      workspaceId: wsVendre.id,
      userId: userAdmin.id,
      userRole: Role.ADMIN,
      data: {
        candidateId: candidate.id,
        entityType: "ORGANIZATION",
        primaryRecordId: orgPrimary.id,
        duplicateRecordId: orgDuplicate.id,
      },
    });

    expect(result.success).toBe(true);

    // Verify contact was transferred to primary org
    const contact = await prisma.contact.findUnique({
      where: { id: contactRecord.id },
    });
    expect(contact?.organizationId).toBe(orgPrimary.id);

    // Verify primary org absorbed empty fields (phone was present on duplicate)
    const updatedPrimary = await prisma.organization.findUniqueOrThrow({
      where: { id: orgPrimary.id },
    });
    expect(updatedPrimary.phone).toBe("+1 800 555 9999");

    // Verify duplicate org was removed
    const checkDup = await prisma.organization.findUnique({
      where: { id: orgDuplicate.id },
    });
    expect(checkDup).toBeNull();

    // Verify candidate marked as MERGED
    const updatedCandidate = await prisma.duplicateCandidate.findUniqueOrThrow({
      where: { id: candidate.id },
    });
    expect(updatedCandidate.status).toBe(DuplicateStatus.MERGED);

    // Verify audit log
    const audit = await prisma.auditLog.findFirst({
      where: {
        workspaceId: wsVendre.id,
        action: "ORGANIZATION_MERGED",
        entityId: orgPrimary.id,
      },
    });
    expect(audit).not.toBeNull();
  });
});
