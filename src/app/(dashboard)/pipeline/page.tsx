import React from "react";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { getPipelineKanbanData } from "@/services/pipeline.service";
import { PipelineBoard } from "@/components/PipelineBoard";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Plus, Table } from "lucide-react";

export default async function PipelinePage() {
  const ctx = (await getAuthenticatedWorkspaceContext())!;
  const stages = await getPipelineKanbanData(ctx.workspace.id);

  const canEdit = ["OWNER", "ADMIN", "MANAGER", "SALES"].includes(ctx.membership.role);

  const totalValue = stages.reduce((sum, s) => sum + s.totalValue, 0);
  const totalDeals = stages.reduce((sum, s) => sum + s.dealCount, 0);

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Pipeline</h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
              ${totalValue.toLocaleString()} ({totalDeals} Deals)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Visual sales stages for <span className="font-semibold text-slate-700">{ctx.workspace.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/deals">
            <Button variant="outline" size="sm">
              <Table className="w-4 h-4 mr-1 text-slate-500" />
              Table View
            </Button>
          </Link>
        </div>
      </div>

      {/* Kanban Board Component */}
      <PipelineBoard stages={stages as any} canEdit={canEdit} />
    </div>
  );
}
