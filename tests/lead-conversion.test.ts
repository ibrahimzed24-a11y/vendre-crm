import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { convertLeadToDeal } from "../src/services/lead.service";
import { Role, LeadStatus, DealStatus } from "@prisma/client";

describe("Transactional Lead-to-Deal Conversion", () => {
  let wsVendre: any;
  let wsAgency: any;
  let userSales: any;
  let stageVendre: any;
  let stageAgency: any;
  let testLead: any;

  beforeAll(async () => {
    wsVendre = await prisma.workspace.findUniqueOrThrow({ where: { slug: "vendre-sales" } });
    wsAgency = await prisma.workspace.findUniqueOrThrow({ where: { slug: "agency-sales" } });

    userSales = await prisma.user.findUniqueOrThrow({ where: { email: "sales@vendre.com" } });

    stageVendre = await prisma.pipelineStage.findFirstOrThrow({ where: { workspaceId: wsVendre.id } });
    stageAgency = await prisma.pipelineStage.findFirstOrThrow({ where: { workspaceId: wsAgency.id } });

    // Create a fresh test lead for conversion testing
    testLead = await prisma.lead.create({
      data: {
        workspaceId: wsVendre.id,
        title: "Test Qualification Lead for Conversion",
        estimatedValue: 45000.0,
        status: LeadStatus.QUALIFIED,
        createdById: userSales.id,
        ownerId: userSales.id,
      },
    });
  });

  it("Rejects conversion if target stage belongs to a different workspace", async () => {
    await expect(
      convertLeadToDeal({
        workspaceId: wsVendre.id,
        userId: userSales.id,
        userRole: Role.SALES,
        data: {
          leadId: testLead.id,
          dealTitle: "Cross Stage Conversion",
          stageId: stageAgency.id, // Agency stage!
          value: 45000,
        },
      })
    ).rejects.toThrow("Destination pipeline stage does not belong to active workspace.");

    // Verify lead status was NOT altered (transaction rolled back)
    const unchangedLead = await prisma.lead.findUniqueOrThrow({ where: { id: testLead.id } });
    expect(unchangedLead.status).toBe(LeadStatus.QUALIFIED);
  });

  it("Successfully converts lead to deal atomically and records audit log", async () => {
    const result = await convertLeadToDeal({
      workspaceId: wsVendre.id,
      userId: userSales.id,
      userRole: Role.SALES,
      data: {
        leadId: testLead.id,
        dealTitle: "Converted Enterprise Deal",
        stageId: stageVendre.id,
        value: 55000,
      },
    });

    expect(result.deal).toBeDefined();
    expect(result.deal.title).toBe("Converted Enterprise Deal");
    expect(result.deal.value).toBe(55000);
    expect(result.deal.workspaceId).toBe(wsVendre.id);

    // Verify lead status updated to CONVERTED
    const updatedLead = await prisma.lead.findUniqueOrThrow({ where: { id: testLead.id } });
    expect(updatedLead.status).toBe(LeadStatus.CONVERTED);
    expect(updatedLead.convertedDealId).toBe(result.deal.id);

    // Verify audit log entry exists
    const audit = await prisma.auditLog.findFirst({
      where: {
        workspaceId: wsVendre.id,
        action: "LEAD_CONVERTED",
        entityId: testLead.id,
      },
    });
    expect(audit).not.toBeNull();
  });

  it("Prevents repeated conversion of an already converted lead", async () => {
    await expect(
      convertLeadToDeal({
        workspaceId: wsVendre.id,
        userId: userSales.id,
        userRole: Role.SALES,
        data: {
          leadId: testLead.id,
          dealTitle: "Second Conversion Attempt",
          stageId: stageVendre.id,
          value: 10000,
        },
      })
    ).rejects.toThrow("Lead has already been converted.");
  });
});
