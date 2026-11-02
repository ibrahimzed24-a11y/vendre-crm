"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Target,
  Building,
  User,
  CalendarCheck,
  CheckSquare,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { LeadConvertModal } from "@/components/LeadConvertModal";
import { createActivityAction, createTaskAction, updateTaskAction } from "@/app/actions/crm";
import { Role } from "@prisma/client";

interface LeadDetailClientProps {
  lead: any;
  userRole: Role;
  stages: any[];
}

export function LeadDetailClient({ lead: l, userRole, stages }: LeadDetailClientProps) {
  const [activeTab, setActiveTab] = useState<"activities" | "tasks">("activities");
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isLogActivityOpen, setIsLogActivityOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  const [activityType, setActivityType] = useState("CALL");
  const [activitySubject, setActivitySubject] = useState("");
  const [activityDescription, setActivityDescription] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = ["OWNER", "ADMIN", "MANAGER", "SALES"].includes(userRole);

  async function handleLogActivity(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createActivityAction({
        type: activityType,
        subject: activitySubject,
        description: activityDescription || undefined,
        leadId: l.id,
        contactId: l.contactId || undefined,
        organizationId: l.organizationId || undefined,
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
        leadId: l.id,
        contactId: l.contactId || undefined,
        organizationId: l.organizationId || undefined,
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
          href="/leads"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Leads
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl border border-amber-100 shadow-xs flex-shrink-0">
              <Target className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{l.title}</h1>
                <Badge variant={l.status === "CONVERTED" ? "green" : "blue"}>{l.status}</Badge>
                <Badge variant={l.priority === "URGENT" ? "red" : "slate"}>{l.priority}</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                <div className="font-bold text-sm text-slate-900">
                  Est. ${l.estimatedValue.toLocaleString()}
                </div>
                <span>•</span>
                <div>Source: {l.source}</div>
                {l.organization && (
                  <>
                    <span>•</span>
                    <Link
                      href={`/organizations/${l.organization.id}`}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>{l.organization.name}</span>
                    </Link>
                  </>
                )}
                {l.contact && (
                  <>
                    <span>•</span>
                    <Link
                      href={`/contacts/${l.contact.id}`}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>
                        {l.contact.firstName} {l.contact.lastName}
                      </span>
                    </Link>
                  </>
                )}
                {l.nextFollowUp && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1 text-amber-600 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Follow-up: {new Date(l.nextFollowUp).toLocaleDateString()}</span>
                    </div>
                  </>
                )}
              </div>

              {l.description && (
                <p className="text-xs text-slate-600 mt-3 max-w-3xl leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {l.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {l.status !== "CONVERTED" && canEdit ? (
              <Button size="md" variant="primary" onClick={() => setIsConvertOpen(true)}>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Convert to Deal
              </Button>
            ) : l.convertedDeal ? (
              <Link href={`/deals/${l.convertedDeal.id}`}>
                <Button size="md" variant="secondary">
                  <Briefcase className="w-4 h-4 mr-1.5 text-blue-600" />
                  View Converted Deal
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("activities")}
            className={`py-3 px-1 border-b-2 font-semibold text-xs transition-colors flex items-center gap-2 ${
              activeTab === "activities"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Activities ({l.activities.length})</span>
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
            <span>Tasks ({l.tasks.length})</span>
          </button>
        </nav>
      </div>

      {/* ACTIVITIES TAB */}
      {activeTab === "activities" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Lead Interaction Timeline</h3>
            {canEdit && (
              <Button size="sm" variant="primary" onClick={() => setIsLogActivityOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Log Activity
              </Button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs divide-y divide-slate-100">
            {l.activities.map((act: any) => (
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
            {l.activities.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">No activities logged yet.</div>
            )}
          </div>
        </div>
      )}

      {/* TASKS TAB */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Follow-up Tasks</h3>
            {canEdit && (
              <Button size="sm" variant="primary" onClick={() => setIsAddTaskOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Schedule Task
              </Button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs divide-y divide-slate-100">
            {l.tasks.map((t: any) => {
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
            {l.tasks.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">No tasks scheduled.</div>
            )}
          </div>
        </div>
      )}

      {/* Convert Modal */}
      {isConvertOpen && (
        <LeadConvertModal
          isOpen={isConvertOpen}
          onClose={() => setIsConvertOpen(false)}
          lead={l}
          stages={stages}
          onSuccess={() => window.location.reload()}
        />
      )}

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
              <option value="FOLLOW_UP">Follow-Up</option>
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
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
              Schedule Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
