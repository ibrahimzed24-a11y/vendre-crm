"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Search, Download, Trash2, Briefcase, Building, User, Kanban } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { createDealAction, deleteDealAction } from "@/app/actions/crm";
import { Role, DealStatus } from "@prisma/client";

interface DealItem {
  id: string;
  title: string;
  value: number;
  currency: string;
  probability: number;
  status: DealStatus;
  expectedCloseDate: Date | null;
  stage: { id: string; name: string; color: string };
  organization: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string } | null;
  owner: { id: string; name: string } | null;
}

interface StageOption {
  id: string;
  name: string;
}

interface OrgOption {
  id: string;
  name: string;
}

interface ContactOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface DealsClientProps {
  initialDeals: DealItem[];
  total: number;
  page: number;
  totalPages: number;
  userRole: Role;
  stages: StageOption[];
  organizations: OrgOption[];
  contacts: ContactOption[];
}

export function DealsClient({
  initialDeals,
  total,
  page,
  totalPages,
  userRole,
  stages,
  organizations,
  contacts,
}: DealsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [stageId, setStageId] = useState(stages[0]?.id || "");
  const [value, setValue] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [probability, setProbability] = useState(50);
  const [organizationId, setOrganizationId] = useState("");
  const [contactId, setContactId] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [description, setDescription] = useState("");

  const canCreate = ["OWNER", "ADMIN", "MANAGER", "SALES"].includes(userRole);
  const canDelete = ["OWNER", "ADMIN"].includes(userRole);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createDealAction({
        title,
        stageId,
        value: Number(value),
        currency,
        probability: Number(probability),
        organizationId: organizationId || undefined,
        contactId: contactId || undefined,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate).toISOString() : undefined,
        description: description || undefined,
      });

      setIsCreateOpen(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to create deal.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete deal "${title}"?`)) return;
    try {
      await deleteDealAction(id);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to delete deal.");
    }
  }

  const filtered = initialDeals.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.organization && d.organization.name.toLowerCase().includes(search.toLowerCase())) ||
      (d.contact &&
        `${d.contact.firstName} ${d.contact.lastName}`.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    const matchesStage = stageFilter === "ALL" || d.stage.id === stageFilter;

    return matchesSearch && matchesStatus && matchesStage;
  });

  function getStatusVariant(status: DealStatus) {
    switch (status) {
      case "WON":
        return "green";
      case "LOST":
        return "red";
      default:
        return "blue";
    }
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Deals</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active sales opportunities progressing towards closed revenue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/pipeline">
            <Button variant="outline" size="sm">
              <Kanban className="w-4 h-4 mr-1 text-slate-500" />
              Kanban Board
            </Button>
          </Link>

          <a href="/api/export/deals" download>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1 text-slate-500" />
              Export CSV
            </Button>
          </a>

          {canCreate && (
            <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Deal
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deals..."
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
            {["ALL", "OPEN", "WON", "LOST"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-1 rounded-md font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? "bg-white text-blue-600 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st.toLowerCase()}
              </button>
            ))}
          </div>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Pipeline Stages</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-semibold text-slate-800">{filtered.length}</span> of{" "}
          <span className="font-semibold text-slate-800">{total}</span> deals
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Deal</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Value</th>
                <th className="py-3 px-4">Organization & Contact</th>
                <th className="py-3 px-4">Close Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/deals/${d.id}`}
                      className="font-semibold text-slate-900 hover:text-blue-600 block transition-colors"
                    >
                      {d.title}
                    </Link>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      Owner: {d.owner?.name || "Unassigned"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1.5"
                      style={{ backgroundColor: d.stage.color }}
                    />
                    {d.stage.name}
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <Badge variant={getStatusVariant(d.status)}>{d.status}</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <div className="font-bold text-emerald-600">
                      ${d.value.toLocaleString()} {d.currency}
                    </div>
                    <div className="text-[11px] text-slate-400">{d.probability}% prob</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {d.organization && (
                      <div className="flex items-center gap-1 font-medium text-slate-800">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{d.organization.name}</span>
                      </div>
                    )}
                    {d.contact && (
                      <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>
                          {d.contact.firstName} {d.contact.lastName}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {d.expectedCloseDate
                      ? new Date(d.expectedCloseDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/deals/${d.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(d.id, d.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete deal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No deals found matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Deal Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Deal"
        description="Initiate a qualified deal in your pipeline."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Deal Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Platform Enterprise Contract"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Pipeline Stage <span className="text-rose-500">*</span>
              </label>
              <select
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Value ($)</label>
              <input
                type="number"
                min="0"
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Organization</label>
              <select
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">No Organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Primary Contact</label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">No Contact</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Probability (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={probability}
                onChange={(e) => setProbability(parseInt(e.target.value, 10) || 50)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Target Close Date</label>
              <input
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Deal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
