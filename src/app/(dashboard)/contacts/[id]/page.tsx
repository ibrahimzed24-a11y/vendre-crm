import React from "react";
import { notFound } from "next/navigation";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { getContactById } from "@/services/contact.service";
import { getPipelineStages } from "@/services/pipeline.service";
import { ContactDetailClient } from "./ContactDetailClient";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = (await getAuthenticatedWorkspaceContext())!;
  const { id } = await params;

  const [contact, stages] = await Promise.all([
    getContactById(ctx.workspace.id, id),
    getPipelineStages(ctx.workspace.id),
  ]);

  if (!contact) {
    notFound();
  }

  return (
    <ContactDetailClient
      contact={contact}
      userRole={ctx.membership.role}
      stages={stages}
    />
  );
}
