import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";
import { generateCsv, parseCsv, sanitizeCsvField } from "@/lib/csv";
import { Role, LeadStatus, Priority, DealStatus } from "@prisma/client";

export async function exportEntitiesToCsv(params: {
  workspaceId: string;
  userRole: Role;
  entityType: "organizations" | "contacts" | "leads" | "deals";
}) {
  assertPermission(params.userRole, "EXPORT_DATA");

  switch (params.entityType) {
    case "organizations": {
      const records = await prisma.organization.findMany({
        where: { workspaceId: params.workspaceId },
        include: { owner: { select: { email: true } } },
      });
      return generateCsv(
        [
          { key: "name", header: "Name" },
          { key: "website", header: "Website" },
          { key: "industry", header: "Industry" },
          { key: "country", header: "Country" },
          { key: "city", header: "City" },
          { key: "phone", header: "Phone" },
          { key: "email", header: "Email" },
          { key: "address", header: "Address" },
          { key: "description", header: "Description" },
          { key: "ownerEmail", header: "Owner Email" },
        ],
        records.map((r) => ({
          ...r,
          ownerEmail: r.owner?.email || "",
        }))
      );
    }
    case "contacts": {
      const records = await prisma.contact.findMany({
        where: { workspaceId: params.workspaceId },
        include: {
          organization: { select: { name: true } },
          owner: { select: { email: true } },
        },
      });
      return generateCsv(
        [
          { key: "firstName", header: "First Name" },
          { key: "lastName", header: "Last Name" },
          { key: "organizationName", header: "Organization" },
          { key: "jobTitle", header: "Job Title" },
          { key: "email", header: "Email" },
          { key: "phone", header: "Phone" },
          { key: "whatsApp", header: "WhatsApp" },
          { key: "country", header: "Country" },
          { key: "city", header: "City" },
          { key: "notes", header: "Notes" },
        ],
        records.map((r) => ({
          ...r,
          organizationName: r.organization?.name || "",
        }))
      );
    }
    case "leads": {
      const records = await prisma.lead.findMany({
        where: { workspaceId: params.workspaceId },
        include: {
          contact: { select: { email: true, firstName: true, lastName: true } },
          organization: { select: { name: true } },
          owner: { select: { email: true } },
        },
      });
      return generateCsv(
        [
          { key: "title", header: "Title" },
          { key: "status", header: "Status" },
          { key: "priority", header: "Priority" },
          { key: "estimatedValue", header: "Estimated Value" },
          { key: "source", header: "Source" },
          { key: "organizationName", header: "Organization" },
          { key: "contactEmail", header: "Contact Email" },
          { key: "ownerEmail", header: "Owner Email" },
        ],
        records.map((r) => ({
          ...r,
          organizationName: r.organization?.name || "",
          contactEmail: r.contact?.email || "",
          ownerEmail: r.owner?.email || "",
        }))
      );
    }
    case "deals": {
      const records = await prisma.deal.findMany({
        where: { workspaceId: params.workspaceId },
        include: {
          stage: { select: { name: true } },
          organization: { select: { name: true } },
          contact: { select: { email: true } },
          owner: { select: { email: true } },
        },
      });
      return generateCsv(
        [
          { key: "title", header: "Title" },
          { key: "stageName", header: "Stage" },
          { key: "value", header: "Value" },
          { key: "currency", header: "Currency" },
          { key: "probability", header: "Probability" },
          { key: "status", header: "Status" },
          { key: "organizationName", header: "Organization" },
          { key: "contactEmail", header: "Contact Email" },
          { key: "ownerEmail", header: "Owner Email" },
        ],
        records.map((r) => ({
          ...r,
          stageName: r.stage.name,
          organizationName: r.organization?.name || "",
          contactEmail: r.contact?.email || "",
          ownerEmail: r.owner?.email || "",
        }))
      );
    }
  }
}

export async function importEntitiesFromCsv(params: {
  workspaceId: string;
  userId: string;
  userRole: Role;
  entityType: "organizations" | "contacts" | "leads";
  csvContent: string;
}) {
  assertPermission(params.userRole, "IMPORT_DATA");
  const { headers, rows } = parseCsv(params.csvContent);

  if (rows.length === 0) {
    throw new Error("CSV file contains no valid rows.");
  }

  return prisma.$transaction(async (tx) => {
    const job = await tx.importJob.create({
      data: {
        workspaceId: params.workspaceId,
        entityType: params.entityType.toUpperCase(),
        totalRows: rows.length,
        createdById: params.userId,
      },
    });

    let successCount = 0;
    const errors: { row: number; error: string; raw: any }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Header is row 1

      try {
        if (params.entityType === "organizations") {
          const name = row["Name"] || row["name"];
          if (!name) throw new Error("Missing organization Name");

          await tx.organization.create({
            data: {
              workspaceId: params.workspaceId,
              name,
              website: row["Website"] || row["website"] || null,
              industry: row["Industry"] || row["industry"] || null,
              country: row["Country"] || row["country"] || null,
              city: row["City"] || row["city"] || null,
              phone: row["Phone"] || row["phone"] || null,
              email: row["Email"] || row["email"] || null,
              address: row["Address"] || row["address"] || null,
              description: row["Description"] || row["description"] || null,
              createdById: params.userId,
              ownerId: params.userId,
            },
          });
          successCount++;
        } else if (params.entityType === "contacts") {
          const firstName = row["First Name"] || row["firstName"] || row["First"] || "";
          const lastName = row["Last Name"] || row["lastName"] || row["Last"] || "";
          if (!firstName || !lastName) throw new Error("Missing First Name or Last Name");

          // Look up org if specified
          const orgName = row["Organization"] || row["organization"] || "";
          let orgId: string | null = null;
          if (orgName) {
            const foundOrg = await tx.organization.findFirst({
              where: { name: orgName, workspaceId: params.workspaceId },
            });
            orgId = foundOrg ? foundOrg.id : null;
          }

          await tx.contact.create({
            data: {
              workspaceId: params.workspaceId,
              firstName,
              lastName,
              organizationId: orgId,
              email: row["Email"] || row["email"] || null,
              phone: row["Phone"] || row["phone"] || null,
              jobTitle: row["Job Title"] || row["jobTitle"] || null,
              city: row["City"] || row["city"] || null,
              country: row["Country"] || row["country"] || null,
              createdById: params.userId,
              ownerId: params.userId,
            },
          });
          successCount++;
        } else if (params.entityType === "leads") {
          const title = row["Title"] || row["title"];
          if (!title) throw new Error("Missing Lead Title");

          const val = parseFloat(row["Estimated Value"] || row["estimatedValue"] || "0");

          await tx.lead.create({
            data: {
              workspaceId: params.workspaceId,
              title,
              estimatedValue: isNaN(val) ? 0 : val,
              source: row["Source"] || row["source"] || "Imported",
              status: LeadStatus.NEW,
              priority: Priority.MEDIUM,
              createdById: params.userId,
              ownerId: params.userId,
            },
          });
          successCount++;
        }
      } catch (err: any) {
        errors.push({
          row: rowNum,
          error: err.message || "Failed to import row",
          raw: row,
        });
      }
    }

    // Record row errors if any
    for (const err of errors) {
      await tx.importRowError.create({
        data: {
          importJobId: job.id,
          rowNumber: err.row,
          rawContent: err.raw,
          errorMessage: err.error,
        },
      });
    }

    await tx.importJob.update({
      where: { id: job.id },
      data: {
        successRows: successCount,
        failedRows: errors.length,
        status: errors.length === 0 ? "SUCCESS" : successCount > 0 ? "PARTIAL" : "FAILED",
      },
    });

    await tx.auditLog.create({
      data: {
        workspaceId: params.workspaceId,
        userId: params.userId,
        action: "CSV_IMPORT_COMPLETED",
        entityType: params.entityType.toUpperCase(),
        entityId: job.id,
        metadata: {
          totalRows: rows.length,
          successRows: successCount,
          failedRows: errors.length,
        },
      },
    });

    return {
      jobId: job.id,
      totalRows: rows.length,
      successRows: successCount,
      failedRows: errors.length,
      errors,
    };
  });
}
