import React from "react";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { listContacts } from "@/services/contact.service";
import { prisma } from "@/lib/prisma";
import { ContactsClient } from "./ContactsClient";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string }>;
}) {
  const ctx = (await getAuthenticatedWorkspaceContext())!;
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const [data, orgs] = await Promise.all([
    listContacts({
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
  ]);

  return (
    <ContactsClient
      initialContacts={data.items as any}
      total={data.total}
      page={data.page}
      totalPages={data.totalPages}
      userRole={ctx.membership.role}
      organizations={orgs}
    />
  );
}
