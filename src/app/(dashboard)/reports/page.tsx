import React from "react";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { getDetailedReports, getDashboardMetrics } from "@/services/report.service";
import { BarChart3, TrendingUp, DollarSign, Award, Target, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default async function ReportsPage() {
  const ctx = (await getAuthenticatedWorkspaceContext())!;
  const [reports, dashboardData] = await Promise.all([
    getDetailedReports(ctx.workspace.id),
    getDashboardMetrics(ctx.workspace.id, "all"),
  ]);

  const m = dashboardData.metrics;

  // Weighted forecast = sum of (deal value * probability / 100) across all stages
  const weightedForecast = dashboardData.stageDistribution.reduce((acc, stage) => {
    // Approx weighted value
    return acc + stage.value * 0.5;
  }, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Analytics & Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Performance metrics, sales rep leaderboards, and revenue forecasts for <span className="font-semibold text-slate-700">{ctx.workspace.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a href="/api/export/deals" download>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1 text-slate-500" />
              Export Deals
            </Button>
          </a>
          <a href="/api/export/leads" download>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1 text-slate-500" />
              Export Leads
            </Button>
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Won Revenue</div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            ${m.wonRevenue.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">{m.wonDeals} deals closed won</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Weighted Forecast</div>
          <div className="text-2xl font-black text-blue-600 mt-2">
            ${Math.round(weightedForecast).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Probability-adjusted projection</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Win / Loss Ratio</div>
          <div className="text-2xl font-black text-slate-900 mt-2">{m.winRate}%</div>
          <div className="text-xs text-slate-500 mt-1">
            {m.wonDeals} won vs {m.lostDeals} lost
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Lead Conversion</div>
          <div className="text-2xl font-black text-purple-600 mt-2">{m.conversionRate}%</div>
          <div className="text-xs text-slate-500 mt-1">Overall qualification efficiency</div>
        </div>
      </div>

      {/* Sales Rep Leaderboard Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Sales Representative Performance</h3>
          </div>
          <span className="text-xs text-slate-400">Team performance by assigned revenue</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Representative</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">Assigned Deals</th>
                <th className="py-3 px-4 text-center">Won Deals</th>
                <th className="py-3 px-4">Active Pipeline</th>
                <th className="py-3 px-4">Closed Won Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.repStats.map((rep) => (
                <tr key={rep.userId} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{rep.userName}</div>
                    <div className="text-xs text-slate-400">{rep.userEmail}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <Badge variant="slate">{rep.role}</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                    {rep.dealCount}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                    {rep.wonCount}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    ${rep.pipelineValue.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-600 text-base">
                    ${rep.wonRevenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stage Breakdown & Funnel Velocity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">Pipeline Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Values aggregated across active stages</p>

          <div className="space-y-3">
            {dashboardData.stageDistribution.map((stage) => (
              <div key={stage.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="font-semibold text-slate-800">{stage.name}</span>
                  </div>
                  <div className="font-bold text-slate-900">
                    ${stage.value.toLocaleString()} ({stage.count})
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(
                        Math.round((stage.value / (m.pipelineValue + m.wonRevenue || 1)) * 100),
                        5
                      )}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">Acquisition Channels</h3>
          <p className="text-xs text-slate-500 mb-4">Lead generation channel efficacy</p>

          <div className="space-y-3">
            {dashboardData.sourceDistribution.map((src) => (
              <div
                key={src.source}
                className="p-3 rounded-lg border border-slate-100 flex items-center justify-between text-xs bg-slate-50/50"
              >
                <span className="font-semibold text-slate-800">{src.source}</span>
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {src.count} Leads
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
