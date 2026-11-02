import React from "react";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { listDeals } from "@/services/deal.service";
import { getPipelineStages } from "@/services/pipeline.service";
import { prisma } from "@/lib/prisma";
import { DealsClient } from "./DealsClient";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string }>;
}) {
  const ctx = (await getAuthenticatedWorkspaceContext())!;
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const [data, stages, orgs, contacts] = await Promise.all([
    listDeals({
      workspaceId: ctx.workspace.id,
      query: params.query,
      page,
      limit: 50,
    }),
    getPipelineStages(ctx.workspace.id),
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
  ]);

  return (
    <DealsClient
      initialDeals={data.items as any}
      total={data.total}
      page={data.page}
      totalPages={data.totalPages}
      userRole={ctx.membership.role}
      stages={stages}
      organizations={orgs}
      contacts={contacts}
    />
  );
}
