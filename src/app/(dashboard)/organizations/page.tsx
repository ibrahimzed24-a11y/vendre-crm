import React from "react";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { listOrganizations } from "@/services/organization.service";
import { OrganizationsClient } from "./OrganizationsClient";

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string }>;
}) {
  const ctx = (await getAuthenticatedWorkspaceContext())!;
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const data = await listOrganizations({
    workspaceId: ctx.workspace.id,
    query: params.query,
    page,
    limit: 50,
  });

  return (
    <OrganizationsClient
      initialOrgs={data.items as any}
      total={data.total}
      page={data.page}
      totalPages={data.totalPages}
      userRole={ctx.membership.role}
      workspaceSlug={ctx.workspace.slug}
    />
  );
}
