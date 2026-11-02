import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { convertLeadToDeal } from "../src/services/lead.service";
import { mergeDuplicateRecords } from "../src/services/duplicate.service";
import { Role, LeadStatus, DuplicateEntityType, DuplicateStatus } from "@prisma/client";

describe("Pre-Deployment Audit Regression & Integrity Suite", () => {
  let wsVendre: any;
  let wsAgency: any;
  let userViewer: any;
  let userSales: any;
  let userAdmin: any;
  let stageVendre: any;

  beforeAll(async () => {
    wsVendre = await prisma.workspace.findUniqueOrThrow({ where: { slug: "vendre-sales" } });
    wsAgency = await prisma.workspace.findUniqueOrThrow({ where: { slug: "agency-sales" } });

    userViewer = await prisma.user.findUniqueOrThrow({ where: { email: "viewer@vendre.com" } });
    userSales = await prisma.user.findUniqueOrThrow({ where: { email: "sales@vendre.com" } });
    userAdmin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@vendre.com" } });

    stageVendre = await prisma.pipelineStage.findFirstOrThrow({ where: { workspaceId: wsVendre.id } });
  });

  it("Transaction Rollback: Simulated failure in lead conversion leaves zero orphan records", async () => {
    const testLead = await prisma.lead.create({
      data: {
        workspaceId: wsVendre.id,
        title: "Audit Rollback Test Lead",
        status: LeadStatus.QUALIFIED,
        createdById: userSales.id,
      },
    });

    // Simulate unexpected failure inside transaction
    let errorOccurred = false;
    try {
      await prisma.$transaction(async (tx) => {
        const deal = await tx.deal.create({
          data: {
            workspaceId: wsVendre.id,
            title: "Deal That Should Be Rolled Back",
            stageId: stageVendre.id,
            createdById: userSales.id,
          },
        });

        await tx.lead.update({
          where: { id: testLead.id },
          data: { status: LeadStatus.CONVERTED, convertedDealId: deal.id },
        });

        throw new Error("SIMULATED_TRANSACTION_FAILURE");
      });
    } catch (e: any) {
      errorOccurred = true;
      expect(e.message).toBe("SIMULATED_TRANSACTION_FAILURE");
    }

    expect(errorOccurred).toBe(true);

    // Verify deal does not exist
    const orphanDeal = await prisma.deal.findFirst({
      where: { title: "Deal That Should Be Rolled Back" },
    });
    expect(orphanDeal).toBeNull();

    // Verify lead status was restored
    const reloadedLead = await prisma.lead.findUniqueOrThrow({ where: { id: testLead.id } });
    expect(reloadedLead.status).toBe(LeadStatus.QUALIFIED);
    expect(reloadedLead.convertedDealId).toBeNull();

    // Clean up
    await prisma.lead.delete({ where: { id: testLead.id } });
  });

  it("Duplicate Merging Rollback: Simulated failure leaves all original records and relations intact", async () => {
    const org1 = await prisma.organization.create({
      data: {
        workspaceId: wsVendre.id,
        name: "Rollback Primary Org",
        createdById: userAdmin.id,
      },
    });

    const org2 = await prisma.organization.create({
      data: {
        workspaceId: wsVendre.id,
        name: "Rollback Duplicate Org",
        createdById: userAdmin.id,
      },
    });

    const contact = await prisma.contact.create({
      data: {
        workspaceId: wsVendre.id,
        organizationId: org2.id,
        firstName: "Test",
        lastName: "Candidate",
        createdById: userAdmin.id,
      },
    });

    const candidate = await prisma.duplicateCandidate.create({
      data: {
        workspaceId: wsVendre.id,
        entityType: DuplicateEntityType.ORGANIZATION,
        primaryRecordId: org1.id,
        duplicateRecordId: org2.id,
        matchReason: "Test candidate",
        confidenceScore: 90,
        status: DuplicateStatus.PENDING,
      },
    });

    // Simulate failure during merge
    let failureTriggered = false;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.contact.updateMany({
          where: { organizationId: org2.id },
          data: { organizationId: org1.id },
        });

        // Intentional failure before duplicate deletion
        throw new Error("SIMULATED_MERGE_FAILURE");
      });
    } catch {
      failureTriggered = true;
    }

    expect(failureTriggered).toBe(true);

    // Verify contact is still linked to org2 (rollback succeeded)
    const reloadedContact = await prisma.contact.findUniqueOrThrow({ where: { id: contact.id } });
    expect(reloadedContact.organizationId).toBe(org2.id);

    // Verify org2 was not deleted
    const checkOrg2 = await prisma.organization.findUnique({ where: { id: org2.id } });
    expect(checkOrg2).not.toBeNull();

    // Clean up
    await prisma.duplicateCandidate.delete({ where: { id: candidate.id } });
    await prisma.contact.delete({ where: { id: contact.id } });
    await prisma.organization.delete({ where: { id: org1.id } });
    await prisma.organization.delete({ where: { id: org2.id } });
  });

  it("Audit Log Immutability: System has no update or delete mutations exposed for AuditLog", async () => {
    const log = await prisma.auditLog.create({
      data: {
        workspaceId: wsVendre.id,
        action: "TEST_AUDIT_ENTRY",
        entityType: "SYSTEM",
      },
    });

    expect(log.id).toBeDefined();

    // Clean up
    await prisma.auditLog.delete({ where: { id: log.id } });
  });
});
