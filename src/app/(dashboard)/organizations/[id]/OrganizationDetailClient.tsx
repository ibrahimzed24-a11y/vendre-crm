"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Target,
  Briefcase,
  CalendarCheck,
  CheckSquare,
  SearchCheck,
  Plus,
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  ExternalLink,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { LeadConvertModal } from "@/components/LeadConvertModal";
import {
  updateOrganizationAction,
  createContactAction,
  createLeadAction,
  createDealAction,
  createActivityAction,
  createTaskAction,
  updateTaskAction,
  createResearchAction,
} from "@/app/actions/crm";
import { Role } from "@prisma/client";

interface OrganizationDetailClientProps {
  organization: any;
  userRole: Role;
  stages: any[];
}

export function OrganizationDetailClient({
  organization: org,
  userRole,
  stages,
}: OrganizationDetailClientProps) {
  const [activeTab, setActiveTab] = useState<
    "contacts" | "leads" | "deals" | "activities" | "tasks" | "research"
  >("contacts");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [isLogActivityOpen, setIsLogActivityOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [selectedLeadForConvert, setSelectedLeadForConvert] = useState<any | null>(null);

  // Form states for adding related entities
  const [contactFirst, setContactFirst] = useState("");
  const [contactLast, setContactLast] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactTitle, setContactTitle] = useState("");

  const [leadTitle, setLeadTitle] = useState("");
  const [leadValue, setLeadValue] = useState(0);

  const [dealTitle, setDealTitle] = useState("");
  const [dealValue, setDealValue] = useState(0);
  const [dealStageId, setDealStageId] = useState(stages[0]?.id || "");

  const [activityType, setActivityType] = useState("NOTE");
  const [activitySubject, setActivitySubject] = useState("");
  const [activityDescription, setActivityDescription] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = ["OWNER", "ADMIN", "MANAGER", "SALES"].includes(userRole);

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createContactAction({
        firstName: contactFirst,
        lastName: contactLast,
        email: contactEmail || undefined,
        phone: contactPhone || undefined,
        jobTitle: contactTitle || undefined,
        organizationId: org.id,
      });
      setIsAddContactOpen(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to create contact.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createLeadAction({
        title: leadTitle,
        estimatedValue: Number(leadValue),
        organizationId: org.id,
      });
      setIsAddLeadOpen(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to create lead.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddDeal(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createDealAction({
        title: dealTitle,
        value: Number(dealValue),
        stageId: dealStageId,
        organizationId: org.id,
      });
      setIsAddDealOpen(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to create deal.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogActivity(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createActivityAction({
        type: activityType,
        subject: activitySubject,
        description: activityDescription || undefined,
        organizationId: org.id,
      });
      setIsLogActivityOpen(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to log activity.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createTaskAction({
        title: taskTitle,
        dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
        organizationId: org.id,
      });
      setIsAddTaskOpen(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to schedule task.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleTaskStatus(taskId: string, currentStatus: string) {
    if (!canEdit) return;
    try {
      const newStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
      await updateTaskAction(taskId, { status: newStatus });
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to update task.");
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center gap-2">
        <Link
          href="/organizations"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Organizations
        </Link>
      </div>

      {/* Organization Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl border border-purple-100 shadow-xs flex-shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
                {org.industry && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {org.industry}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                {(org.city || org.country) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{[org.city, org.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{org.website.replace(/^https?:\/\//, "")}</span>
                  </a>
                )}
                {org.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{org.email}</span>
                  </div>
                )}
                {org.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{org.phone}</span>
                  </div>
                )}
              </div>

              {org.description && (
                <p className="text-xs text-slate-600 mt-3 max-w-3xl leading-relaxed">
                  {org.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <Button size="sm" variant="outline" onClick={() => setIsEditOpen(true)}>
                <Edit3 className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Edit Account
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Detail Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("contacts")}
            className={`py-3 px-1 border-b-2 font-semibold text-xs transition-colors flex items-center gap-2 ${
              activeTab === "contacts"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Contacts ({org.contacts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("leads")}
            className={`py-3 px-1 border-b-2 font-semibold text-xs transition-colors flex items-center gap-2 ${
              activeTab === "leads"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Leads ({org.leads.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("deals")}
            className={`py-3 px-1 border-b-2 font-semibold text-xs transition-colors flex items-center gap-2 ${
              activeTab === "deals"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Deals ({org.deals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("activities")}
            className={`py-3 px-1 border-b-2 font-semibold text-xs transition-colors flex items-center gap-2 ${
              activeTab === "activities"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Activities ({org.activities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`py-3 px-1 border-b-2 font-semibold text-xs transition-colors flex items-center gap-2 ${
              activeTab === "tasks"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Tasks ({org.tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("research")}
            className={`py-3 px-1 border-b-2 font-semibold text-xs transition-colors flex items-center gap-2 ${
              activeTab === "research"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <SearchCheck className="w-4 h-4" />
            <span>Research ({org.researchRecords.length})</span>
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      {/* 1. CONTACTS TAB */}
      {activeTab === "contacts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Associated Contacts</h3>
            {canEdit && (
              <Button size="sm" variant="primary" onClick={() => setIsAddContactOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Contact
              </Button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">Title</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Phone</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {org.contacts.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <Link href={`/contacts/${c.id}`} className="hover:text-blue-600">
                        {c.firstName} {c.lastName}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{c.jobTitle || "—"}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{c.email || "—"}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{c.phone || "—"}</td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/contacts/${c.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {org.contacts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      No contacts associated with this organization.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. LEADS TAB */}
      {activeTab === "leads" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Related Leads</h3>
            {canEdit && (
              <Button size="sm" variant="primary" onClick={() => setIsAddLeadOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Lead
              </Button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-2.5 px-4">Title</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Priority</th>
                  <th className="py-2.5 px-4">Estimated Value</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {org.leads.map((l: any) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <Link href={`/leads/${l.id}`} className="hover:text-blue-600">
                        {l.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <Badge variant={l.status === "CONVERTED" ? "green" : "blue"}>
                        {l.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{l.priority}</td>
                    <td className="py-3 px-4 text-xs font-bold text-slate-800">
                      ${l.estimatedValue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {l.status !== "CONVERTED" && canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLeadForConvert(l)}
                        >
                          Convert to Deal
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {org.leads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      No leads recorded for this organization.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. DEALS TAB */}
      {activeTab === "deals" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Pipeline Deals</h3>
            {canEdit && (
              <Button size="sm" variant="primary" onClick={() => setIsAddDealOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Deal
              </Button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-2.5 px-4">Deal Title</th>
                  <th className="py-2.5 px-4">Stage</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Value</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {org.deals.map((d: any) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <Link href={`/deals/${d.id}`} className="hover:text-blue-600">
                        {d.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700">{d.stage.name}</td>
                    <td className="py-3 px-4 text-xs">
                      <Badge
                        variant={d.status === "WON" ? "green" : d.status === "LOST" ? "red" : "blue"}
                      >
                        {d.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-emerald-600">
                      ${d.value.toLocaleString()} {d.currency}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/deals/${d.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {org.deals.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      No deals created for this organization.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ACTIVITIES TAB */}
      {activeTab === "activities" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Activity Timeline</h3>
            {canEdit && (
              <Button size="sm" variant="primary" onClick={() => setIsLogActivityOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Log Activity
              </Button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs divide-y divide-slate-100">
            {org.activities.map((act: any) => (
              <div key={act.id} className="py-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="blue">{act.type}</Badge>
                    <span className="font-semibold text-slate-900 text-sm">{act.subject}</span>
                  </div>
                  <span className="text-slate-400">
                    {new Date(act.date).toLocaleDateString()}
                  </span>
                </div>
                {act.description && (
                  <p className="text-xs text-slate-600 pl-2 border-l-2 border-slate-200 ml-1">
                    {act.description}
                  </p>
                )}
                <div className="text-[11px] text-slate-400">
                  Logged by {act.author.name}
                  {act.outcome && ` • Outcome: ${act.outcome}`}
                </div>
              </div>
            ))}
            {org.activities.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">No activities recorded.</div>
            )}
          </div>
        </div>
      )}

      {/* 5. TASKS TAB */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Tasks</h3>
            {canEdit && (
              <Button size="sm" variant="primary" onClick={() => setIsAddTaskOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Schedule Task
              </Button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs divide-y divide-slate-100">
            {org.tasks.map((t: any) => {
              const isCompleted = t.status === "COMPLETED";

              return (
                <div key={t.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => toggleTaskStatus(t.id, t.status)}
                      disabled={!canEdit}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span
                        className={`text-sm font-medium ${
                          isCompleted ? "line-through text-slate-400" : "text-slate-900"
                        }`}
                      >
                        {t.title}
                      </span>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Assigned to: {t.assignedUser?.name || "Unassigned"}</span>
                        {t.dueDate && (
                          <span>• Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant={t.priority === "URGENT" ? "red" : "slate"}>
                    {t.priority}
                  </Badge>
                </div>
              );
            })}
            {org.tasks.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">No tasks scheduled.</div>
            )}
          </div>
        </div>
      )}

      {/* 6. RESEARCH TAB */}
      {activeTab === "research" && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Qualitative Research & Notes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {org.researchRecords.map((r: any) => (
              <div key={r.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="purple">{r.category}</Badge>
                  <span className="text-[11px] text-slate-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{r.title}</h4>
                <p className="text-xs text-slate-600">{r.description}</p>
                {r.sourceUrl && (
                  <a
                    href={r.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>Source Reference</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
            {org.researchRecords.length === 0 && (
              <div className="col-span-2 py-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                No research records logged for this organization.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Add Contact Modal */}
      <Modal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        title="Add Contact to Organization"
      >
        <form onSubmit={handleAddContact} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={contactFirst}
                onChange={(e) => setContactFirst(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={contactLast}
                onChange={(e) => setContactLast(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Job Title</label>
            <input
              type="text"
              value={contactTitle}
              onChange={(e) => setContactTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsAddContactOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Contact
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Add Lead Modal */}
      <Modal isOpen={isAddLeadOpen} onClose={() => setIsAddLeadOpen(false)} title="New Lead">
        <form onSubmit={handleAddLead} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Lead Title *</label>
            <input
              type="text"
              required
              value={leadTitle}
              onChange={(e) => setLeadTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Estimated Value</label>
            <input
              type="number"
              min="0"
              value={leadValue}
              onChange={(e) => setLeadValue(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsAddLeadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Lead
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Add Deal Modal */}
      <Modal isOpen={isAddDealOpen} onClose={() => setIsAddDealOpen(false)} title="New Deal">
        <form onSubmit={handleAddDeal} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Deal Title *</label>
            <input
              type="text"
              required
              value={dealTitle}
              onChange={(e) => setDealTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Deal Value</label>
              <input
                type="number"
                min="0"
                value={dealValue}
                onChange={(e) => setDealValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Initial Stage</label>
              <select
                value={dealStageId}
                onChange={(e) => setDealStageId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsAddDealOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Deal
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Log Activity Modal */}
      <Modal
        isOpen={isLogActivityOpen}
        onClose={() => setIsLogActivityOpen(false)}
        title="Log Activity"
      >
        <form onSubmit={handleLogActivity} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Activity Type</label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="CALL">Phone Call</option>
              <option value="EMAIL">Email</option>
              <option value="MEETING">Meeting</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="NOTE">Internal Note</option>
              <option value="FOLLOW_UP">Follow-up</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Subject *</label>
            <input
              type="text"
              required
              value={activitySubject}
              onChange={(e) => setActivitySubject(e.target.value)}
              placeholder="e.g. Discussed Q1 renewal terms"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Summary</label>
            <textarea
              rows={3}
              value={activityDescription}
              onChange={(e) => setActivityDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsLogActivityOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Activity
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Add Task Modal */}
      <Modal isOpen={isAddTaskOpen} onClose={() => setIsAddTaskOpen(false)} title="Schedule Task">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Send pricing proposal"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsAddTaskOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Schedule Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Lead Convert Modal */}
      {selectedLeadForConvert && (
        <LeadConvertModal
          isOpen={!!selectedLeadForConvert}
          onClose={() => setSelectedLeadForConvert(null)}
          lead={selectedLeadForConvert}
          stages={stages}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}
