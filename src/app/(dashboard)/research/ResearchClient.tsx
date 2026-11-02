"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, SearchCheck, ExternalLink, Building, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { createResearchAction, deleteResearchAction } from "@/app/actions/crm";
import { Role, ResearchCategory } from "@prisma/client";

interface ResearchItem {
  id: string;
  title: string;
  category: ResearchCategory;
  description: string;
  sourceUrl: string | null;
  createdAt: Date;
  author: { id: string; name: string };
  organization: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string } | null;
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

interface ResearchClientProps {
  initialRecords: ResearchItem[];
  userRole: Role;
  organizations: OrgOption[];
  contacts: ContactOption[];
}

export function ResearchClient({
  initialRecords,
  userRole,
  organizations,
  contacts,
}: ResearchClientProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ResearchCategory>(ResearchCategory.MARKET);
  const [description, setDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [contactId, setContactId] = useState("");

  const canCreate = ["OWNER", "ADMIN", "MANAGER", "SALES"].includes(userRole);
  const canDelete = ["OWNER", "ADMIN"].includes(userRole);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await createResearchAction({
        title,
        category,
        description,
        sourceUrl: sourceUrl || undefined,
        organizationId: organizationId || undefined,
        contactId: contactId || undefined,
      });
      setIsCreateOpen(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to save research record.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this research record?")) return;
    try {
      await deleteResearchAction(id);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to delete research record.");
    }
  }

  const filtered = initialRecords.filter(
    (r) => categoryFilter === "ALL" || r.category === categoryFilter
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Market & Sales Intelligence</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured repository for industry briefs, competitor positioning, and qualitative intel.
          </p>
        </div>

        {canCreate && (
          <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Intelligence Record
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
          {["ALL", "ORGANIZATION", "CONTACT", "INDUSTRY", "MARKET", "COMPETITOR", "OPPORTUNITY"].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  categoryFilter === cat
                    ? "bg-white text-blue-600 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {cat.toLowerCase()}
              </button>
            )
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-semibold text-slate-800">{filtered.length}</span> records
        </div>
      </div>

      {/* Research Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="purple">{item.category}</Badge>
                <span className="text-[11px] text-slate-400">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>By {item.author.name}</span>
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {canDelete && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            No research records recorded in this category.
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record Intelligence Brief"
        description="Add structured qualitative notes, industry trends, or competitor updates."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. EU Supply Chain Compliance Mandate"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="MARKET">Market Intelligence</option>
              <option value="INDUSTRY">Industry Regulatory / Trend</option>
              <option value="COMPETITOR">Competitor Analysis</option>
              <option value="OPPORTUNITY">Strategic Opportunity</option>
              <option value="ORGANIZATION">Organization Deep-Dive</option>
              <option value="CONTACT">Executive Background</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Source URL</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Brief Content *</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of findings, regulatory requirements, competitor pricing models..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Intelligence
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
