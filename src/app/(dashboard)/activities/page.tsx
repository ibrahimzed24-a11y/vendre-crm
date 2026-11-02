import React from "react";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { listActivities } from "@/services/activity.service";
import { prisma } from "@/lib/prisma";
import { ActivitiesClient } from "./ActivitiesClient";

export default async function ActivitiesPage() {
  const ctx = (await getAuthenticatedWorkspaceContext())!;

  const [data, orgs, contacts] = await Promise.all([
    listActivities({
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
    <ActivitiesClient
      initialActivities={data.items as any}
      total={data.total}
      userRole={ctx.membership.role}
      organizations={orgs}
      contacts={contacts}
    />
  );
}
