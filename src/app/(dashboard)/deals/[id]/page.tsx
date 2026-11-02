import React from "react";
import { notFound } from "next/navigation";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { getDealById } from "@/services/deal.service";
import { getPipelineStages } from "@/services/pipeline.service";
import { DealDetailClient } from "./DealDetailClient";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = (await getAuthenticatedWorkspaceContext())!;
  const { id } = await params;

  const [deal, stages] = await Promise.all([
    getDealById(ctx.workspace.id, id),
    getPipelineStages(ctx.workspace.id),
  ]);

  if (!deal) {
    notFound();
  }

  return (
    <DealDetailClient
      deal={deal}
      userRole={ctx.membership.role}
      stages={stages}
    />
  );
}
