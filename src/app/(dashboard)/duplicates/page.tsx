import React from "react";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { listDuplicateCandidates } from "@/services/duplicate.service";
import { DuplicatesClient } from "./DuplicatesClient";

export default async function DuplicatesPage() {
  const ctx = (await getAuthenticatedWorkspaceContext())!;
  const candidates = await listDuplicateCandidates(ctx.workspace.id);

  return (
    <DuplicatesClient
      candidates={candidates as any}
      userRole={ctx.membership.role}
    />
  );
}
