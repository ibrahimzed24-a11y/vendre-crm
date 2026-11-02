import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { listOrganizations, getOrganizationById, updateOrganization, deleteOrganization } from "../src/services/organization.service";
import { listLeads, createLead } from "../src/services/lead.service";
import { globalSearch } from "../src/services/search.service";
import { getDashboardMetrics } from "../src/services/report.service";
import { exportEntitiesToCsv } from "../src/services/import-export.service";
import { Role } from "@prisma/client";

describe("Strict Multi-Workspace Isolation", () => {
  let wsVendre: any;
  let wsAgency: any;
  let vendreUser: any;
  let agencyUser: any;
  let orgVendre: any;
  let orgAgency: any;

  beforeAll(async () => {
    wsVendre = await prisma.workspace.findUniqueOrThrow({ where: { slug: "vendre-sales" } });
    wsAgency = await prisma.workspace.findUniqueOrThrow({ where: { slug: "agency-sales" } });

    vendreUser = await prisma.user.findUniqueOrThrow({ where: { email: "admin@vendre.com" } });
    agencyUser = await prisma.user.findUniqueOrThrow({ where: { email: "agency.lead@vendre.com" } });

    orgVendre = await prisma.organization.findFirstOrThrow({ where: { workspaceId: wsVendre.id } });
    orgAgency = await prisma.organization.findFirstOrThrow({ where: { workspaceId: wsAgency.id } });
  });

  it("Workspace A cannot read Workspace B records via list query", async () => {
    const data = await listOrganizations({ workspaceId: wsVendre.id });
    const containsAgencyRecord = data.items.some((item) => item.workspaceId === wsAgency.id);
    expect(containsAgencyRecord).toBe(false);
    expect(data.items.every((item) => item.workspaceId === wsVendre.id)).toBe(true);
  });

  it("Workspace A cannot access Workspace B record directly by ID (IDOR prevention)", async () => {
    const record = await getOrganizationById(wsVendre.id, orgAgency.id);
    expect(record).toBeNull();
  });

  it("Workspace A cannot update Workspace B record", async () => {
    await expect(
      updateOrganization({
        workspaceId: wsVendre.id,
        userId: vendreUser.id,
        userRole: Role.ADMIN,
        id: orgAgency.id,
        data: { name: "Malicious Cross-Tenant Rename" },
      })
    ).rejects.toThrow("Organization not found in active workspace.");
  });

  it("Workspace A cannot delete Workspace B record", async () => {
    await expect(
      deleteOrganization({
        workspaceId: wsVendre.id,
        userId: vendreUser.id,
        userRole: Role.ADMIN,
        id: orgAgency.id,
      })
    ).rejects.toThrow("Organization not found in active workspace.");
  });

  it("Cross-workspace relationships are strictly rejected on creation", async () => {
    // Attempt to link an agency organization to a lead created in VENDRE Sales
    await expect(
      createLead({
        workspaceId: wsVendre.id,
        userId: vendreUser.id,
        userRole: Role.ADMIN,
        data: {
          title: "Cross Workspace Attempt",
          organizationId: orgAgency.id, // Belonging to Agency Sales!
        },
      })
    ).rejects.toThrow("Specified organization does not belong to active workspace.");
  });

  it("Global Search is strictly scoped to the active workspace", async () => {
    // Search for agency company name inside Vendre workspace
    const results = await globalSearch(wsVendre.id, orgAgency.name);
    expect(results.some((r) => r.id === orgAgency.id)).toBe(false);

    // Search inside Agency workspace
    const agencyResults = await globalSearch(wsAgency.id, orgAgency.name);
    expect(agencyResults.some((r) => r.id === orgAgency.id)).toBe(true);
  });

  it("Dashboard metrics strictly isolate totals to active workspace", async () => {
    const [vendreMetrics, agencyMetrics] = await Promise.all([
      getDashboardMetrics(wsVendre.id),
      getDashboardMetrics(wsAgency.id),
    ]);

    expect(vendreMetrics.metrics.organizations).toBeGreaterThan(0);
    expect(agencyMetrics.metrics.organizations).toBeGreaterThan(0);

    // Total orgs in system must equal sum of both isolated counts
    const totalDbOrgs = await prisma.organization.count();
    expect(vendreMetrics.metrics.organizations + agencyMetrics.metrics.organizations).toBe(totalDbOrgs);
  });

  it("CSV Exports never contain cross-workspace records", async () => {
    const csv = await exportEntitiesToCsv({
      workspaceId: wsVendre.id,
      userRole: Role.ADMIN,
      entityType: "organizations",
    });

    expect(csv).toContain(orgVendre.name);
    expect(csv).not.toContain(orgAgency.name);
  });
});
