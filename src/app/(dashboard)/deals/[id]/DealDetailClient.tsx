"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Building,
  User,
  CalendarCheck,
  CheckSquare,
  Plus,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Calendar,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  moveDealStageAction,
  updateDealAction,
  createActivityAction,
  createTaskAction,
  updateTaskAction,
} from "@/app/actions/crm";
import { Role, DealStatus } from "@prisma/client";

interface DealDetailClientProps {
  deal: any;
  userRole: Role;
  stages: any[];
}

export function DealDetailClient({ deal: d, userRole, stages }: DealDetailClientProps) {
  const [activeTab, setActiveTab] = useState<"activities" | "tasks">("activities");
  const [isLogActivityOpen, setIsLogActivityOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const [activityType, setActivityType] = useState("MEETING");
  const [activitySubject, setActivitySubject] = useState("");
  const [activityDescription, setActivityDescription] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = ["OWNER", "ADMIN", "MANAGER", "SALES"].includes(userRole);

  async function handleStageChange(targetStageId: string) {
    if (!canEdit || isMoving || targetStageId === d.stageId) return;
    setIsMoving(true);
    try {
      await moveDealStageAction({
        dealId: d.id,
        destinationStageId: targetStageId,
      });
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to update pipeline stage.");
    } finally {
      setIsMoving(false);
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
        dealId: d.id,
        contactId: d.contactId || undefined,
        organizationId: d.organizationId || undefined,
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
        dealId: d.id,
        contactId: d.contactId || undefined,
        organizationId: d.organizationId || undefined,
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
          href="/deals"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Deals
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl border border-emerald-100 shadow-xs flex-shrink-0">
              <Briefcase className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{d.title}</h1>
                <Badge
                  variant={d.status === "WON" ? "green" : d.status === "LOST" ? "red" : "blue"}
                >
                  {d.status}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                <div className="font-bold text-base text-emerald-600">
                  ${d.value.toLocaleString()} {d.currency}
                </div>
                <span>•</span>
                <div>Probability: {d.probability}%</div>
                <span>•</span>
                <div>Owner: {d.owner?.name || "Unassigned"}</div>
                {d.organization && (
                  <>
                    <span>•</span>
                    <Link
                      href={`/organizations/${d.organization.id}`}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>{d.organization.name}</span>
                    </Link>
                  </>
                )}
                {d.contact && (
                  <>
                    <span>•</span>
                    <Link
                      href={`/contacts/${d.contact.id}`}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>
                        {d.contact.firstName} {d.contact.lastName}
                      </span>
                    </Link>
                  </>
                )}
                {d.expectedCloseDate && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Target: {new Date(d.expectedCloseDate).toLocaleDateString()}</span>
                    </div>
                  </>
                )}
              </div>

              {d.description && (
                <p className="text-xs text-slate-600 mt-3 max-w-3xl leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {d.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline Stage Visual Progression Tracker */}
        <div className="pt-4 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Pipeline Stage Progression
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {stages.map((stage, idx) => {
              const isCurrent = stage.id === d.stageId;
              const isPast = stage.displayOrder < d.stage.displayOrder;

              return (
                <button
                  key={stage.id}
                  onClick={() => handleStageChange(stage.id)}
                  disabled={!canEdit || isMoving}
                  className={`p-2.5 rounded-lg border text-left transition-all relative ${
                    isCurrent
                      ? "border-blue-600 bg-blue-50 text-blue-900 shadow-xs font-bold"
                      : isPast
                      ? "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-medium"
                      : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="text-[10px] text-slate-400 font-mono">0{idx + 1}</span>
                  </div>
                  <div className="text-xs truncate">{stage.name}</div>
                </button>
              );
            })}
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
            <span>Activities ({d.activities.length})</span>
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
            <span>Tasks ({d.tasks.length})</span>
          </button>
        </nav>
      </div>

      {/* ACTIVITIES TAB */}
      {activeTab === "activities" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Deal Interaction Timeline</h3>
            {canEdit && (
              <Button size="sm" variant="primary" onClick={() => setIsLogActivityOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Log Activity
              </Button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs divide-y divide-slate-100">
            {d.activities.map((act: any) => (
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
            {d.activities.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">No activities logged yet.</div>
            )}
          </div>
        </div>
      )}

      {/* TASKS TAB */}
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
            {d.tasks.map((t: any) => {
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
            {d.tasks.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">No tasks scheduled.</div>
            )}
          </div>
        </div>
      )}

      {/* Log Activity Modal */}
      <Modal
        isOpen={isLogActivityOpen}
        onClose={() => setIsLogActivityOpen(false)}
        title="Log Deal Activity"
      >
        <form onSubmit={handleLogActivity} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Activity Type</label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="MEETING">Meeting</option>
              <option value="CALL">Call</option>
              <option value="EMAIL">Email</option>
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
