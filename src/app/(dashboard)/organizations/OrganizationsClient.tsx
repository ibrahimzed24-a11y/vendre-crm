"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Search, Download, Upload, Trash2, Edit, Building2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CsvImportModal } from "@/components/CsvImportModal";
import { createOrganizationAction, deleteOrganizationAction } from "@/app/actions/crm";
import { Role } from "@prisma/client";

interface OrgItem {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  country: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  owner: { id: string; name: string } | null;
  _count: { contacts: number; leads: number; deals: number };
}

interface OrganizationsClientProps {
  initialOrgs: OrgItem[];
  total: number;
  page: number;
  totalPages: number;
  userRole: Role;
  workspaceSlug: string;
}

export function OrganizationsClient({
  initialOrgs,
  total,
  page,
  totalPages,
  userRole,
  workspaceSlug,
}: OrganizationsClientProps) {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");

  const canCreate = ["OWNER", "ADMIN", "MANAGER", "SALES"].includes(userRole);
  const canDelete = ["OWNER", "ADMIN"].includes(userRole);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createOrganizationAction({
        name,
        website: website || undefined,
        industry: industry || undefined,
        country: country || undefined,
        city: city || undefined,
        phone: phone || undefined,
        email: email || undefined,
        description: description || undefined,
      });
      setIsCreateOpen(false);
      setName("");
      setWebsite("");
      setIndustry("");
      setCountry("");
      setCity("");
      setPhone("");
      setEmail("");
      setDescription("");
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to create organization.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? Dependent records must be reassigned first.`)) {
      return;
    }

    try {
      await deleteOrganizationAction(id);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to delete organization.");
    }
  }

  const filtered = initialOrgs.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.industry && o.industry.toLowerCase().includes(search.toLowerCase())) ||
      (o.city && o.city.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organizations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage company accounts, subsidiaries, and corporate relationships.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a href="/api/export/organizations" download>
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
              Add Organization
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations by name, industry, city..."
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-semibold text-slate-800">{filtered.length}</span> of{" "}
          <span className="font-semibold text-slate-800">{total}</span> organizations
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Organization Name</th>
                <th className="py-3 px-4">Industry</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4 text-center">Contacts</th>
                <th className="py-3 px-4 text-center">Deals</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <Link
                      href={`/organizations/${org.id}`}
                      className="hover:text-blue-600 transition-colors flex items-center gap-2"
                    >
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>{org.name}</span>
                    </Link>
                    {org.website && (
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-400 hover:text-blue-500 inline-flex items-center gap-1 mt-0.5 ml-6"
                      >
                        {org.website.replace(/^https?:\/\//, "")}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 text-xs">{org.industry || "—"}</td>
                  <td className="py-3.5 px-4 text-slate-600 text-xs">
                    {[org.city, org.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">
                    {org.owner?.name || "Unassigned"}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {org._count.contacts}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                      {org._count.deals}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/organizations/${org.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(org.id, org.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete organization"
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
                    No organizations found matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Organization"
        description="Record a new company or client account in active workspace."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Organization Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corporation"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Logistics"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={3}
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
              Create Organization
            </Button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        defaultEntity="organizations"
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
