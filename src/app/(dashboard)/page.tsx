import React from "react";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { getDashboardMetrics } from "@/services/report.service";
import Link from "next/link";
import {
  Building2,
  Users,
  Target,
  Briefcase,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Calendar,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: "month" | "quarter" | "year" | "all" }>;
}) {
  const ctx = (await getAuthenticatedWorkspaceContext())!;
  const { period = "all" } = await searchParams;

  const data = await getDashboardMetrics(ctx.workspace.id, period);
  const m = data.metrics;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Date Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time sales velocity and performance for <span className="font-semibold text-slate-700">{ctx.workspace.name}</span>
          </p>
        </div>

        {/* Date Filters & Quick Actions */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs">
            <Link
              href="/?period=month"
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                period === "month" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              This Month
            </Link>
            <Link
              href="/?period=quarter"
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                period === "quarter" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Quarter
            </Link>
            <Link
              href="/?period=year"
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                period === "year" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Year
            </Link>
            <Link
              href="/?period=all"
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                period === "all" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Time
            </Link>
          </div>

          <Link href="/leads">
            <Button size="sm" variant="primary">
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pipeline Value */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Pipeline
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              ${m.pipelineValue.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Across <span className="font-semibold text-slate-700">{m.openDeals}</span> open deals
            </div>
          </div>
        </div>

        {/* Won Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Won Revenue
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600">
              ${m.wonRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              <span className="font-semibold text-emerald-700">{m.wonDeals}</span> closed won deals
            </div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Win Rate
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{m.winRate}%</div>
            <div className="text-xs text-slate-500 mt-1">
              Won vs lost closed decisions
            </div>
          </div>
        </div>

        {/* Lead Conversion */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lead Conversion
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-600">{m.conversionRate}%</div>
            <div className="text-xs text-slate-500 mt-1">
              From <span className="font-semibold text-slate-700">{m.leads}</span> total leads
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/organizations"
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center gap-3"
        >
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{m.organizations}</div>
            <div className="text-xs text-slate-500">Organizations</div>
          </div>
        </Link>

        <Link
          href="/contacts"
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center gap-3"
        >
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{m.contacts}</div>
            <div className="text-xs text-slate-500">Contacts</div>
          </div>
        </Link>

        <Link
          href="/tasks?overdue=true"
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-rose-400 hover:shadow-xs transition-all flex items-center gap-3"
        >
          <div className={`p-2.5 rounded-lg ${m.overdueTasks > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600"}`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className={`text-lg font-bold ${m.overdueTasks > 0 ? "text-rose-600" : "text-slate-900"}`}>
              {m.overdueTasks}
            </div>
            <div className="text-xs text-slate-500">Overdue Tasks</div>
          </div>
        </Link>

        <Link
          href="/activities"
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center gap-3"
        >
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{m.completedActivities}</div>
            <div className="text-xs text-slate-500">Activities Logged</div>
          </div>
        </Link>
      </div>

      {/* Middle Grid: Pipeline Distribution & Lead Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Distribution */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pipeline Stage Distribution</h3>
              <p className="text-xs text-slate-500">Value and volume across stages</p>
            </div>
            <Link
              href="/pipeline"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Open Kanban <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {data.stageDistribution.map((s) => {
              const maxVal = Math.max(...data.stageDistribution.map((d) => d.value), 1);
              const pct = Math.round((s.value / maxVal) * 100);

              return (
                <div key={s.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="font-medium text-slate-800">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">{s.count} deal(s)</span>
                      <span className="font-bold text-slate-800">${s.value.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Sources Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Lead Sources</h3>
            <p className="text-xs text-slate-500 mb-4">Acquisition channels</p>

            <div className="space-y-3">
              {data.sourceDistribution.map((src) => (
                <div key={src.source} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{src.source}</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                      {src.count}
                    </span>
                  </div>
                </div>
              ))}
              {data.sourceDistribution.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">No leads recorded yet</div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <Link
              href="/leads"
              className="w-full py-2 px-3 text-xs font-semibold text-center text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg block transition-colors"
            >
              Manage All Leads
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Activities & Upcoming Follow-ups / Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Recent Workspace Activities</h3>
            <Link href="/activities" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data.recentActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="blue">{act.type}</Badge>
                    <span className="text-sm font-semibold text-slate-800">{act.subject}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Logged by <span className="font-medium text-slate-700">{act.author.name}</span>
                    {act.organization && ` • ${act.organization.name}`}
                    {act.deal && ` • Deal: ${act.deal.title}`}
                  </div>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {new Date(act.date).toLocaleDateString()}
                </span>
              </div>
            ))}

            {data.recentActivities.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">No activities logged yet</div>
            )}
          </div>
        </div>

        {/* Upcoming Follow-ups & Tasks */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Upcoming Follow-ups</h3>
            <Link href="/tasks" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Tasks
            </Link>
          </div>

          <div className="space-y-3">
            {data.upcomingFollowUps.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 block transition-all"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-900 truncate">{lead.title}</span>
                  <span className="text-amber-600 font-semibold whitespace-nowrap">
                    {lead.nextFollowUp ? new Date(lead.nextFollowUp).toLocaleDateString() : ""}
                  </span>
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {lead.organization?.name || "Independent Lead"}
                </div>
              </Link>
            ))}

            {data.upcomingFollowUps.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                No follow-ups due in next 7 days
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
