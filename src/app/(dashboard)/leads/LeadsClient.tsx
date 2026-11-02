"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Search, Download, Upload, Trash2, Target, Building, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { CsvImportModal } from "@/components/CsvImportModal";
import { LeadConvertModal } from "@/components/LeadConvertModal";
import { createLeadAction, deleteLeadAction } from "@/app/actions/crm";
import { Role, LeadStatus, Priority } from "@prisma/client";

interface LeadItem {
  id: string;
  title: string;
  source: string;
  status: LeadStatus;
  priority: Priority;
  estimatedValue: number;
  expectedCloseDate: Date | null;
  nextFollowUp: Date | null;
  contact: { id: string; firstName: string; lastName: string; email: string | null } | null;
  organization: { id: string; name: string } | null;
  owner: { id: string; name: string } | null;
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

interface StageOption {
  id: string;
  name: string;
  color: string;
}

interface LeadsClientProps {
  initialLeads: LeadItem[];
  total: number;
  page: number;
  totalPages: number;
  userRole: Role;
  organizations: OrgOption[];
  contacts: ContactOption[];
  stages: StageOption[];
}

export function LeadsClient({
  initialLeads,
  total,
  page,
  totalPages,
  userRole,
  organizations,
  contacts,
  stages,
}: LeadsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedLeadForConvert, setSelectedLeadForConvert] = useState<LeadItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [estimatedValue, setEstimatedValue] = useState(0);
  const [source, setSource] = useState("Inbound");
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [organizationId, setOrganizationId] = useState("");
  const [contactId, setContactId] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [description, setDescription] = useState("");

  const canCreate = ["OWNER", "ADMIN", "MANAGER", "SALES"].includes(userRole);
  const canDelete = ["OWNER", "ADMIN"].includes(userRole);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createLeadAction({
        title,
        estimatedValue: Number(estimatedValue),
        source,
        priority,
        organizationId: organizationId || undefined,
        contactId: contactId || undefined,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp).toISOString() : undefined,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate).toISOString() : undefined,
        description: description || undefined,
      });

      setIsCreateOpen(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to create lead.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete lead "${title}"?`)) return;
    try {
      await deleteLeadAction(id);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to delete lead.");
    }
  }

  const filtered = initialLeads.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      (l.organization && l.organization.name.toLowerCase().includes(search.toLowerCase())) ||
      (l.contact &&
        `${l.contact.firstName} ${l.contact.lastName}`.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function getStatusVariant(status: LeadStatus) {
    switch (status) {
      case "CONVERTED":
        return "green";
      case "QUALIFIED":
        return "blue";
      case "CONTACTED":
        return "purple";
      case "UNQUALIFIED":
        return "red";
      default:
        return "amber";
    }
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leads</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Capture, qualify, and convert new sales opportunities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a href="/api/export/leads" download>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1 text-slate-500" />
              Export CSV
            </Button>
          </a>

          {canCreate && (
            <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
              <Upload className="w-4 h-4 mr-1 text-slate-500" />
              Import CSV
            </Button>
          )}

          {canCreate && (
            <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Lead
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by title, company, contact..."
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
            {["ALL", "NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "UNQUALIFIED"].map((st) => (
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
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-semibold text-slate-800">{filtered.length}</span> of{" "}
          <span className="font-semibold text-slate-800">{total}</span> leads
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Lead Title</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Est. Value</th>
                <th className="py-3 px-4">Company & Contact</th>
                <th className="py-3 px-4">Next Follow-up</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/leads/${l.id}`}
                      className="font-semibold text-slate-900 hover:text-blue-600 block transition-colors"
                    >
                      {l.title}
                    </Link>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      Source: {l.source}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <Badge variant={getStatusVariant(l.status)}>{l.status}</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-700">{l.priority}</td>
                  <td className="py-3.5 px-4 text-xs font-bold text-slate-900">
                    ${l.estimatedValue.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {l.organization && (
                      <div className="flex items-center gap-1 font-medium text-slate-800">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{l.organization.name}</span>
                      </div>
                    )}
                    {l.contact && (
                      <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>
                          {l.contact.firstName} {l.contact.lastName}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {l.nextFollowUp ? (
                      <span className="text-amber-700 font-medium">
                        {new Date(l.nextFollowUp).toLocaleDateString()}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {l.status !== "CONVERTED" && canCreate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLeadForConvert(l)}
                          title="Convert this lead into a Deal"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Convert
                        </Button>
                      )}
                      <Link href={`/leads/${l.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(l.id, l.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete lead"
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
                    No leads found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Lead Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Lead"
        description="Record a prospect opportunity."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Lead Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Enterprise Cloud Migration Contract"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Estimated Value ($)
              </label>
              <input
                type="number"
                min="0"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Contact</label>
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Source</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Inbound, Referral, Cold Email"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Next Follow-Up Date
              </label>
              <input
                type="date"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
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
              Create Lead
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lead Convert Modal */}
      {selectedLeadForConvert && (
        <LeadConvertModal
          isOpen={!!selectedLeadForConvert}
          onClose={() => setSelectedLeadForConvert(null)}
          lead={selectedLeadForConvert}
          stages={stages}
          onSuccess={() => window.location.reload()}
        />
      )}

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        defaultEntity="leads"
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
