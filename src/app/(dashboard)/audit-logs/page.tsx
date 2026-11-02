import React from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { listAuditLogs } from "@/services/audit.service";
import { ShieldAlert, User, Clock, FileText } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entityType?: string; page?: string }>;
}) {
  const ctx = (await getAuthenticatedWorkspaceContext())!;

  // Authorization check: only OWNER and ADMIN can access audit logs
  if (!["OWNER", "ADMIN"].includes(ctx.membership.role)) {
    redirect("/");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  const data = await listAuditLogs({
    workspaceId: ctx.workspace.id,
    userRole: ctx.membership.role,
    action: params.action,
    entityType: params.entityType,
    page,
    limit: 50,
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Log</h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Tamper-evident record of administrative events, data modifications, conversions, and security changes in <span className="font-semibold text-slate-700">{ctx.workspace.name}</span>.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Event Details & Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {data.items.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-semibold font-sans">
                    {log.user ? (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.user.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">System</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="uppercase text-[11px] font-semibold tracking-wider text-slate-500">
                      {log.entityType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 max-w-md truncate">
                    {log.metadata ? (
                      <span className="text-slate-600 font-mono text-[11px]">
                        {JSON.stringify(log.metadata)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}

              {data.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-sm font-sans">
                    No audit logs recorded for this workspace.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
