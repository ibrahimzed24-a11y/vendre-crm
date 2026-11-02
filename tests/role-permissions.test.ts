import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { createOrganization, deleteOrganization, updateOrganization } from "../src/services/organization.service";
import { convertLeadToDeal } from "../src/services/lead.service";
import { createPipelineStage, deletePipelineStage } from "../src/services/pipeline.service";
import { listAuditLogs } from "../src/services/audit.service";
import { createTask } from "../src/services/task.service";
import { Role } from "@prisma/client";

describe("Strict Role-Based Access Control (RBAC)", () => {
  let wsVendre: any;
  let userViewer: any;
  let userSales: any;
  let userManager: any;
  let userAdmin: any;
  let userOwner: any;
  let testLead: any;
  let testStage: any;

  beforeAll(async () => {
    wsVendre = await prisma.workspace.findUniqueOrThrow({ where: { slug: "vendre-sales" } });

    userViewer = await prisma.user.findUniqueOrThrow({ where: { email: "viewer@vendre.com" } });
    userSales = await prisma.user.findUniqueOrThrow({ where: { email: "sales@vendre.com" } });
    userManager = await prisma.user.findUniqueOrThrow({ where: { email: "manager@vendre.com" } });
    userAdmin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@vendre.com" } });
    userOwner = await prisma.user.findUniqueOrThrow({ where: { email: "owner@vendre.com" } });

    testLead = await prisma.lead.findFirstOrThrow({ where: { workspaceId: wsVendre.id, status: "NEW" } }).catch(() =>
      prisma.lead.findFirstOrThrow({ where: { workspaceId: wsVendre.id } })
    );
    testStage = await prisma.pipelineStage.findFirstOrThrow({ where: { workspaceId: wsVendre.id } });
  });

  it("VIEW_ONLY users are strictly prohibited from creating records", async () => {
    await expect(
      createOrganization({
        workspaceId: wsVendre.id,
        userId: userViewer.id,
        userRole: Role.VIEW_ONLY,
        data: { name: "Unauthorized Org" },
      })
    ).rejects.toThrow("Permission denied: Role VIEW_ONLY is not permitted to perform CREATE_RECORDS");
  });

  it("VIEW_ONLY users cannot convert leads", async () => {
    await expect(
      convertLeadToDeal({
        workspaceId: wsVendre.id,
        userId: userViewer.id,
        userRole: Role.VIEW_ONLY,
        data: {
          leadId: testLead.id,
          dealTitle: "Illegal Conversion Attempt",
          stageId: testStage.id,
          value: 1000,
        },
      })
    ).rejects.toThrow("Permission denied: Role VIEW_ONLY is not permitted to perform CONVERT_LEAD");
  });

  it("SALES reps cannot delete records", async () => {
    await expect(
      deleteOrganization({
        workspaceId: wsVendre.id,
        userId: userSales.id,
        userRole: Role.SALES,
        id: testLead.organizationId || testStage.id,
      })
    ).rejects.toThrow("Permission denied: Role SALES is not permitted to perform DELETE_RECORDS");
  });

  it("SALES reps cannot reassign record ownership without manager authorization", async () => {
    const org = await prisma.organization.findFirstOrThrow({ where: { workspaceId: wsVendre.id } });
    await expect(
      updateOrganization({
        workspaceId: wsVendre.id,
        userId: userSales.id,
        userRole: Role.SALES,
        id: org.id,
        data: { ownerId: userAdmin.id },
      })
    ).rejects.toThrow("Permission denied: Role SALES is not permitted to perform REASSIGN_OWNER");
  });

  it("SALES reps cannot manage pipeline stages", async () => {
    await expect(
      createPipelineStage({
        workspaceId: wsVendre.id,
        userId: userSales.id,
        userRole: Role.SALES,
        data: { name: "Sales Custom Stage", displayOrder: 10 },
      })
    ).rejects.toThrow("Permission denied: Role SALES is not permitted to perform MANAGE_STAGES");
  });

  it("SALES reps cannot assign tasks to other users", async () => {
    await expect(
      createTask({
        workspaceId: wsVendre.id,
        userId: userSales.id,
        userRole: Role.SALES,
        data: {
          title: "Forced Assignment",
          assignedUserId: userAdmin.id, // Trying to assign to another user
        },
      })
    ).rejects.toThrow("Permission denied: Role SALES is not permitted to perform ASSIGN_TASK_OTHERS");
  });

  it("Only OWNER and ADMIN can access Audit Logs", async () => {
    await expect(
      listAuditLogs({
        workspaceId: wsVendre.id,
        userRole: Role.SALES,
      })
    ).rejects.toThrow("Permission denied: Role SALES is not permitted to perform VIEW_AUDIT_LOGS");

    await expect(
      listAuditLogs({
        workspaceId: wsVendre.id,
        userRole: Role.MANAGER,
      })
    ).rejects.toThrow("Permission denied: Role MANAGER is not permitted to perform VIEW_AUDIT_LOGS");

    const adminLogs = await listAuditLogs({
      workspaceId: wsVendre.id,
      userRole: Role.ADMIN,
    });
    expect(adminLogs.items).toBeDefined();
  });
});
