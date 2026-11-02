import React from "react";
import { notFound } from "next/navigation";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { getOrganizationById } from "@/services/organization.service";
import { getPipelineStages } from "@/services/pipeline.service";
import { OrganizationDetailClient } from "./OrganizationDetailClient";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = (await getAuthenticatedWorkspaceContext())!;
  const { id } = await params;

  const [organization, stages] = await Promise.all([
    getOrganizationById(ctx.workspace.id, id),
    getPipelineStages(ctx.workspace.id),
  ]);

  if (!organization) {
    notFound();
  }

  return (
    <OrganizationDetailClient
      organization={organization}
      userRole={ctx.membership.role}
      stages={stages}
    />
  );
}
