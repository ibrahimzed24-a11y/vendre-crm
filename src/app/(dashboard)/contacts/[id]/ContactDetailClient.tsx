"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Building,
  Target,
  Briefcase,
  CalendarCheck,
  CheckSquare,
  Plus,
  ArrowLeft,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  createLeadAction,
  createDealAction,
  createActivityAction,
  createTaskAction,
  updateTaskAction,
} from "@/app/actions/crm";
import { Role } from "@prisma/client";

interface ContactDetailClientProps {
  contact: any;
  userRole: Role;
  stages: any[];
}

export function ContactDetailClient({
  contact: c,
  userRole,
  stages,
}: ContactDetailClientProps) {
  const [activeTab, setActiveTab] = useState<"deals" | "leads" | "activities" | "tasks">("deals");
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [isLogActivityOpen, setIsLogActivityOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  const [leadTitle, setLeadTitle] = useState("");
  const [leadValue, setLeadValue] = useState(0);

  const [dealTitle, setDealTitle] = useState("");
  const [dealValue, setDealValue] = useState(0);
  const [dealStageId, setDealStageId] = useState(stages[0]?.id || "");

  const [activityType, setActivityType] = useState("CALL");
  const [activitySubject, setActivitySubject] = useState("");
  const [activityDescription, setActivityDescription] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = ["OWNER", "ADMIN", "MANAGER", "SALES"].includes(userRole);

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createLeadAction({
        title: leadTitle,
        estimatedValue: Number(leadValue),
        contactId: c.id,
        organizationId: c.organizationId || undefined,
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
        contactId: c.id,
        organizationId: c.organizationId || undefined,
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
        contactId: c.id,
        organizationId: c.organizationId || undefined,
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
        contactId: c.id,
        organizationId: c.organizationId || undefined,
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
      {/* Top Back Navigation */}
      <div className="flex items-center gap-2">
        <Link
          href="/contacts"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Contacts
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl border border-blue-200 shadow-xs flex-shrink-0">
              {c.firstName.charAt(0)}
              {c.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  {c.firstName} {c.lastName}
                </h1>
                {c.jobTitle && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {c.jobTitle}
                  </span>
                )}
              </div>

              {c.organization && (
                <div className="mt-1">
                  <Link
                    href={`/organizations/${c.organization.id}`}
                    className="text-sm font-semibold text-blue-600 hover:underline inline-flex items-center gap-1.5"
                  >
                    <Building className="w-4 h-4 text-slate-400" />
                    <span>{c.organization.name}</span>
                  </Link>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-blue-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.email}</span>
                  </a>
                )}
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.phone}</span>
                  </a>
                )}
                {c.whatsApp && (
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>WhatsApp: {c.whatsApp}</span>
                  </div>
                )}
                {c.linkedInUrl && (
                  <a
                    href={c.linkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <span>LinkedIn Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {c.notes && (
                <p className="text-xs text-slate-600 mt-3 max-w-3xl leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {c.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("deals")}
            className={`py-3 px-1 border-b-2 font-semibold text-xs transition-colors flex items-center gap-2 ${
              activeTab === "deals"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Deals ({c.deals.length})</span>
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
            <span>Leads ({c.leads.length})</span>
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
            <span>Activities ({c.activities.length})</span>
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
            <span>Tasks ({c.tasks.length})</span>
          </button>
        </nav>
      </div>

      {/* 1. DEALS TAB */}
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
                  <th className="py-2.5 px-4">Title</th>
                  <th className="py-2.5 px-4">Stage</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Value</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {c.deals.map((d: any) => (
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
                {c.deals.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      No deals associated with this contact.
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
            <h3 className="text-sm font-bold text-slate-800">Leads</h3>
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
                  <th className="py-2.5 px-4">Estimated Value</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {c.leads.map((l: any) => (
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
                    <td className="py-3 px-4 text-xs font-bold text-slate-800">
                      ${l.estimatedValue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/leads/${l.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {c.leads.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                      No leads associated with this contact.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ACTIVITIES TAB */}
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
            {c.activities.map((act: any) => (
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
            {c.activities.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">No activities recorded.</div>
            )}
          </div>
        </div>
      )}

      {/* 4. TASKS TAB */}
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
            {c.tasks.map((t: any) => {
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
                        <span>Assigned: {t.assignedUser?.name || "Unassigned"}</span>
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
            {c.tasks.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">No tasks scheduled.</div>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* Add Deal Modal */}
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Value</label>
              <input
                type="number"
                min="0"
                value={dealValue}
                onChange={(e) => setDealValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Stage</label>
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

      {/* Log Activity Modal */}
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
              <option value="CALL">Call</option>
              <option value="EMAIL">Email</option>
              <option value="MEETING">Meeting</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="NOTE">Note</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Subject *</label>
            <input
              type="text"
              required
              value={activitySubject}
              onChange={(e) => setActivitySubject(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
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

      {/* Schedule Task Modal */}
      <Modal isOpen={isAddTaskOpen} onClose={() => setIsAddTaskOpen(false)} title="Schedule Task">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
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
              Save Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
