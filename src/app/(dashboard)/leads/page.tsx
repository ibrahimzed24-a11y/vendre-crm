import React from "react";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { listLeads } from "@/services/lead.service";
import { getPipelineStages } from "@/services/pipeline.service";
import { prisma } from "@/lib/prisma";
import { LeadsClient } from "./LeadsClient";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string }>;
}) {
  const ctx = (await getAuthenticatedWorkspaceContext())!;
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const [data, orgs, contacts, stages] = await Promise.all([
    listLeads({
      workspaceId: ctx.workspace.id,
      query: params.query,
      page,
      limit: 50,
    }),
    prisma.organization.findMany({
      where: { workspaceId: ctx.workspace.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.contact.findMany({
      where: { workspaceId: ctx.workspace.id },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
    getPipelineStages(ctx.workspace.id),
  ]);

  return (
    <LeadsClient
      initialLeads={data.items as any}
      total={data.total}
      page={data.page}
      totalPages={data.totalPages}
      userRole={ctx.membership.role}
      organizations={orgs}
      contacts={contacts}
      stages={stages}
    />
  );
}
