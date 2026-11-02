import React from "react";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { listResearch } from "@/services/research.service";
import { prisma } from "@/lib/prisma";
import { ResearchClient } from "./ResearchClient";

export default async function ResearchPage() {
  const ctx = (await getAuthenticatedWorkspaceContext())!;

  const [data, orgs, contacts] = await Promise.all([
    listResearch({
      workspaceId: ctx.workspace.id,
      limit: 100,
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
  ]);

  return (
    <ResearchClient
      initialRecords={data.items as any}
      userRole={ctx.membership.role}
      organizations={orgs}
      contacts={contacts}
    />
  );
}
