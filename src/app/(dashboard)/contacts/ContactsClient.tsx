"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Search, Download, Upload, Trash2, User, Building, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CsvImportModal } from "@/components/CsvImportModal";
import { createContactAction, deleteContactAction } from "@/app/actions/crm";
import { Role } from "@prisma/client";

interface ContactItem {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  organization: { id: string; name: string } | null;
  owner: { id: string; name: string } | null;
  _count: { leads: number; deals: number };
}

interface OrgOption {
  id: string;
  name: string;
}

interface ContactsClientProps {
  initialContacts: ContactItem[];
  total: number;
  page: number;
  totalPages: number;
  userRole: Role;
  organizations: OrgOption[];
}

export function ContactsClient({
  initialContacts,
  total,
  page,
  totalPages,
  userRole,
  organizations,
}: ContactsClientProps) {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsApp, setWhatsApp] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [notes, setNotes] = useState("");

  const canCreate = ["OWNER", "ADMIN", "MANAGER", "SALES"].includes(userRole);
  const canDelete = ["OWNER", "ADMIN"].includes(userRole);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createContactAction({
        firstName,
        lastName,
        organizationId: organizationId || undefined,
        jobTitle: jobTitle || undefined,
        email: email || undefined,
        phone: phone || undefined,
        whatsApp: whatsApp || undefined,
        city: city || undefined,
        country: country || undefined,
        linkedInUrl: linkedInUrl || undefined,
        notes: notes || undefined,
      });

      setIsCreateOpen(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to create contact.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteContactAction(id);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to delete contact.");
    }
  }

  const filtered = initialContacts.filter((c) => {
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    const query = search.toLowerCase();
    return (
      fullName.includes(query) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.jobTitle && c.jobTitle.toLowerCase().includes(query)) ||
      (c.organization && c.organization.name.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contacts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Key stakeholders, buyers, and decision makers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a href="/api/export/contacts" download>
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
              Add Contact
            </Button>
          )}
        </div>
      </div>

      {/* Search and Counts */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts by name, email, job title..."
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-semibold text-slate-800">{filtered.length}</span> of{" "}
          <span className="font-semibold text-slate-800">{total}</span> contacts
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-center">Deals</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/contacts/${c.id}`}
                      className="font-semibold text-slate-900 hover:text-blue-600 block transition-colors"
                    >
                      {c.firstName} {c.lastName}
                    </Link>
                    {c.jobTitle && (
                      <span className="text-xs text-slate-400 block mt-0.5">{c.jobTitle}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                    {c.organization ? (
                      <Link
                        href={`/organizations/${c.organization.id}`}
                        className="hover:text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.organization.name}</span>
                      </Link>
                    ) : (
                      <span className="text-slate-400">Independent</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {c.email ? (
                      <a href={`mailto:${c.email}`} className="hover:underline flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{c.email}</span>
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} className="hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                      {c._count.deals}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/contacts/${c.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(c.id, `${c.firstName} ${c.lastName}`)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete contact"
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
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    No contacts found.
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
        title="Add New Contact"
        description="Record a new person in your workspace."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Organization (Optional)
            </label>
            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">No Organization (Independent)</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Job Title</label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Head of Engineering"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">WhatsApp</label>
              <input
                type="text"
                value={whatsApp}
                onChange={(e) => setWhatsApp(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">LinkedIn URL</label>
              <input
                type="url"
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Contact
            </Button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        defaultEntity="contacts"
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
