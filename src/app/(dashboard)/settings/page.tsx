import React from "react";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const ctx = (await getAuthenticatedWorkspaceContext())!;

  const [workspace, stages, members] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: ctx.workspace.id },
    }),
    prisma.pipelineStage.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { displayOrder: "asc" },
      include: {
        _count: {
          select: { deals: true },
        },
      },
    }),
    prisma.workspaceMembership.findMany({
      where: { workspaceId: ctx.workspace.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <SettingsClient
      workspace={workspace as any}
      userRole={ctx.membership.role}
      stages={stages as any}
      members={members as any}
    />
  );
}
