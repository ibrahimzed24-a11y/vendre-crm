"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, CalendarCheck, Building, User, Briefcase, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { createActivityAction, deleteActivityAction } from "@/app/actions/crm";
import { Role, ActivityType } from "@prisma/client";

interface ActivityItem {
  id: string;
  type: ActivityType;
  subject: string;
  description: string | null;
  outcome: string | null;
  date: Date;
  author: { id: string; name: string };
  organization: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string } | null;
  deal: { id: string; title: string } | null;
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

interface ActivitiesClientProps {
  initialActivities: ActivityItem[];
  total: number;
  userRole: Role;
  organizations: OrgOption[];
  contacts: ContactOption[];
}

export function ActivitiesClient({
  initialActivities,
  total,
  userRole,
  organizations,
  contacts,
}: ActivitiesClientProps) {
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [type, setType] = useState<ActivityType>(ActivityType.NOTE);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [outcome, setOutcome] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [contactId, setContactId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const canCreate = ["OWNER", "ADMIN", "MANAGER", "SALES"].includes(userRole);
  const canDelete = ["OWNER", "ADMIN"].includes(userRole);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await createActivityAction({
        type,
        subject,
        description: description || undefined,
        outcome: outcome || undefined,
        organizationId: organizationId || undefined,
        contactId: contactId || undefined,
        date: new Date(date).toISOString(),
      });
      setIsLogOpen(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to log activity.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this activity record?")) return;
    try {
      await deleteActivityAction(id);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to delete activity.");
    }
  }

  const filtered = initialActivities.filter(
    (act) => typeFilter === "ALL" || act.type === typeFilter
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activities</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of customer touchpoints, phone calls, meetings, and updates.
          </p>
        </div>

        {canCreate && (
          <Button variant="primary" size="sm" onClick={() => setIsLogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Log Activity
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
          {["ALL", "CALL", "EMAIL", "MEETING", "WHATSAPP", "NOTE", "FOLLOW_UP"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                typeFilter === t
                  ? "bg-white text-blue-600 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-semibold text-slate-800">{filtered.length}</span> activities
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 p-2">
        {filtered.map((act) => (
          <div key={act.id} className="p-4 hover:bg-slate-50/50 transition-colors rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="blue">{act.type}</Badge>
                  <h3 className="text-sm font-bold text-slate-900">{act.subject}</h3>
                </div>

                {act.description && (
                  <p className="text-xs text-slate-600 mt-1 pl-3 border-l-2 border-slate-200">
                    {act.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                  <span>Logged by {act.author.name}</span>
                  {act.organization && (
                    <Link
                      href={`/organizations/${act.organization.id}`}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Building className="w-3 h-3 text-slate-400" />
                      <span>{act.organization.name}</span>
                    </Link>
                  )}
                  {act.contact && (
                    <Link
                      href={`/contacts/${act.contact.id}`}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <User className="w-3 h-3 text-slate-400" />
                      <span>
                        {act.contact.firstName} {act.contact.lastName}
                      </span>
                    </Link>
                  )}
                  {act.deal && (
                    <Link
                      href={`/deals/${act.deal.id}`}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      <span>{act.deal.title}</span>
                    </Link>
                  )}
                  {act.outcome && (
                    <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      Outcome: {act.outcome}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {new Date(act.date).toLocaleDateString()}
                </span>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(act.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-400">
            No activities recorded matching criteria.
          </div>
        )}
      </div>

      {/* Log Activity Modal */}
      <Modal isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} title="Log New Activity">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Activity Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="CALL">Phone Call</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="NOTE">Internal Note</option>
                <option value="FOLLOW_UP">Follow-Up</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Subject *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Contract review call"
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Outcome</label>
            <input
              type="text"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="e.g. Client agreed to review proposal by Tuesday"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Summary</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsLogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Log Activity
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
