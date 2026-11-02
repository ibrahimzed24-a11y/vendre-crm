"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, CheckSquare, Clock, Building, User, Briefcase, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { createTaskAction, updateTaskAction, deleteTaskAction } from "@/app/actions/crm";
import { Role, TaskStatus, Priority } from "@prisma/client";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  dueDate: Date | null;
  completedAt: Date | null;
  assignedUser: { id: string; name: string } | null;
  organization: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string } | null;
  deal: { id: string; title: string } | null;
}

interface MemberOption {
  userId: string;
  userName: string;
}

interface TasksClientProps {
  initialTasks: TaskItem[];
  currentUserId: string;
  userRole: Role;
  members: MemberOption[];
  overdueParam?: boolean;
}

export function TasksClient({
  initialTasks,
  currentUserId,
  userRole,
  members,
  overdueParam,
}: TasksClientProps) {
  const [filter, setFilter] = useState<"MY" | "TEAM" | "OVERDUE" | "COMPLETED">(
    overdueParam ? "OVERDUE" : "MY"
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedUserId, setAssignedUserId] = useState(currentUserId);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);

  const canEdit = ["OWNER", "ADMIN", "MANAGER", "SALES"].includes(userRole);
  const canAssignOthers = ["OWNER", "ADMIN", "MANAGER"].includes(userRole);
  const canDelete = ["OWNER", "ADMIN"].includes(userRole);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await createTaskAction({
        title,
        description: description || undefined,
        assignedUserId: assignedUserId || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        priority,
      });
      setIsCreateOpen(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to schedule task.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleStatus(taskId: string, currentStatus: TaskStatus) {
    if (!canEdit) return;
    try {
      const newStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
      await updateTaskAction(taskId, { status: newStatus });
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to update task.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTaskAction(id);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to delete task.");
    }
  }

  const now = new Date();
  const filtered = initialTasks.filter((t) => {
    if (filter === "MY") return t.assignedUser?.id === currentUserId && t.status !== "COMPLETED";
    if (filter === "TEAM") return t.status !== "COMPLETED";
    if (filter === "OVERDUE") {
      return (
        t.status !== "COMPLETED" &&
        t.status !== "CANCELLED" &&
        t.dueDate &&
        new Date(t.dueDate) < now
      );
    }
    if (filter === "COMPLETED") return t.status === "COMPLETED";
    return true;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tasks</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Action items, deliverables, and team follow-up reminders.
          </p>
        </div>

        {canEdit && (
          <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Schedule Task
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-4 shadow-xs">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
          <button
            onClick={() => setFilter("MY")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filter === "MY"
                ? "bg-white text-blue-600 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            My Tasks
          </button>
          <button
            onClick={() => setFilter("TEAM")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filter === "TEAM"
                ? "bg-white text-blue-600 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Team Tasks
          </button>
          <button
            onClick={() => setFilter("OVERDUE")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filter === "OVERDUE"
                ? "bg-rose-600 text-white shadow-xs font-semibold"
                : "text-slate-600 hover:text-rose-600"
            }`}
          >
            Overdue
          </button>
          <button
            onClick={() => setFilter("COMPLETED")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filter === "COMPLETED"
                ? "bg-white text-emerald-600 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Completed
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-semibold text-slate-800">{filtered.length}</span> tasks
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 p-2">
        {filtered.map((t) => {
          const isCompleted = t.status === "COMPLETED";
          const isOverdue =
            !isCompleted && t.dueDate && new Date(t.dueDate) < now;

          return (
            <div
              key={t.id}
              className={`p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors rounded-lg ${
                isCompleted ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={() => toggleStatus(t.id, t.status)}
                  disabled={!canEdit}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span
                    className={`text-sm font-semibold ${
                      isCompleted ? "line-through text-slate-400" : "text-slate-900"
                    }`}
                  >
                    {t.title}
                  </span>
                  {t.description && (
                    <p className="text-xs text-slate-500">{t.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                    <span>Assigned to: {t.assignedUser?.name || "Unassigned"}</span>
                    {t.dueDate && (
                      <span
                        className={`flex items-center gap-1 ${
                          isOverdue ? "text-rose-600 font-semibold" : ""
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {new Date(t.dueDate).toLocaleDateString()}
                        {isOverdue && " (Overdue)"}
                      </span>
                    )}
                    {t.organization && <span>• {t.organization.name}</span>}
                    {t.deal && <span>• Deal: {t.deal.title}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    t.priority === "URGENT"
                      ? "red"
                      : t.priority === "HIGH"
                      ? "amber"
                      : "slate"
                  }
                >
                  {t.priority}
                </Badge>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-400">
            No tasks found matching filter criteria.
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Schedule New Task">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Follow up on contract signature"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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

          {canAssignOthers && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Assigned User</label>
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.userName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
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
