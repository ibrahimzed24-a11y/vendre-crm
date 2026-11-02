import React from "react";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { listTasks } from "@/services/task.service";
import { prisma } from "@/lib/prisma";
import { TasksClient } from "./TasksClient";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ overdue?: string }>;
}) {
  const ctx = (await getAuthenticatedWorkspaceContext())!;
  const params = await searchParams;

  const [data, members] = await Promise.all([
    listTasks({
      workspaceId: ctx.workspace.id,
      limit: 100,
    }),
    prisma.workspaceMembership.findMany({
      where: { workspaceId: ctx.workspace.id },
      include: {
        user: { select: { id: true, name: true } },
      },
    }),
  ]);

  return (
    <TasksClient
      initialTasks={data.items as any}
      currentUserId={ctx.user.id}
      userRole={ctx.membership.role}
      members={members.map((m) => ({
        userId: m.userId,
        userName: m.user.name,
      }))}
      overdueParam={params.overdue === "true"}
    />
  );
}
