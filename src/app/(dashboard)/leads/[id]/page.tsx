import React from "react";
import { notFound } from "next/navigation";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { getLeadById } from "@/services/lead.service";
import { getPipelineStages } from "@/services/pipeline.service";
import { LeadDetailClient } from "./LeadDetailClient";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = (await getAuthenticatedWorkspaceContext())!;
  const { id } = await params;

  const [lead, stages] = await Promise.all([
    getLeadById(ctx.workspace.id, id),
    getPipelineStages(ctx.workspace.id),
  ]);

  if (!lead) {
    notFound();
  }

  return (
    <LeadDetailClient
      lead={lead}
      userRole={ctx.membership.role}
      stages={stages}
    />
  );
}
