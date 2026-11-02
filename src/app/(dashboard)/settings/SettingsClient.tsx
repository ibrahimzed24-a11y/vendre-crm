"use client";

import React, { useState } from "react";
import { Settings, Users, Kanban, Plus, Trash2, ShieldCheck, Building } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { createPipelineStageAction, deletePipelineStageAction } from "@/app/actions/crm";
import { Role } from "@prisma/client";

interface StageItem {
  id: string;
  name: string;
  displayOrder: number;
  color: string;
  isWon: boolean;
  isLost: boolean;
  _count: { deals: number };
}

interface MemberItem {
  id: string;
  userId: string;
  role: Role;
  user: { id: string; name: string; email: string };
}

interface SettingsClientProps {
  workspace: { id: string; name: string; slug: string; createdAt: Date };
  userRole: Role;
  stages: StageItem[];
  members: MemberItem[];
}

export function SettingsClient({
  workspace,
  userRole,
  stages,
  members,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<"workspace" | "members" | "stages">("workspace");
  const [isAddStageOpen, setIsAddStageOpen] = useState(false);
  const [stageName, setStageName] = useState("");
  const [stageColor, setStageColor] = useState("#3B82F6");
  const [isWon, setIsWon] = useState(false);
  const [isLost, setIsLost] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageStages = ["OWNER", "ADMIN"].includes(userRole);

  async function handleCreateStage(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await createPipelineStageAction({
        name: stageName,
        displayOrder: stages.length + 1,
        color: stageColor,
        isWon,
        isLost,
      });
      setIsAddStageOpen(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to create stage.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteStage(stage: StageItem) {
    if (stage._count.deals > 0) {
      const otherStages = stages.filter((s) => s.id !== stage.id);
      if (otherStages.length === 0) {
        alert("Cannot delete the only pipeline stage.");
        return;
      }
      const reassignmentStageId = prompt(
        `Stage "${stage.name}" has ${stage._count.deals} deal(s). Enter ID of target stage to reassign deals to:\n\nAvailable stages:\n` +
          otherStages.map((s) => `${s.name}: ${s.id}`).join("\n")
      );
      if (!reassignmentStageId) return;

      try {
        await deletePipelineStageAction(stage.id, reassignmentStageId);
        window.location.reload();
      } catch (err: any) {
        alert(err.message || "Failed to delete stage.");
      }
    } else {
      if (!confirm(`Are you sure you want to delete stage "${stage.name}"?`)) return;
      try {
        await deletePipelineStageAction(stage.id);
        window.location.reload();
      } catch (err: any) {
        alert(err.message || "Failed to delete stage.");
      }
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workspace Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configuration, pipeline stages, and access control for <span className="font-semibold text-slate-700">{workspace.name}</span>.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("workspace")}
            className={`py-3 px-1 border-b-2 font-semibold text-xs transition-colors flex items-center gap-2 ${
              activeTab === "workspace"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Workspace Profile</span>
          </button>

          <button
            onClick={() => setActiveTab("members")}
            className={`py-3 px-1 border-b-2 font-semibold text-xs transition-colors flex items-center gap-2 ${
              activeTab === "members"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team Members ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("stages")}
            className={`py-3 px-1 border-b-2 font-semibold text-xs transition-colors flex items-center gap-2 ${
              activeTab === "stages"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Kanban className="w-4 h-4" />
            <span>Pipeline Stages ({stages.length})</span>
          </button>
        </nav>
      </div>

      {/* 1. WORKSPACE PROFILE */}
      {activeTab === "workspace" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-2xl space-y-4">
          <h3 className="text-base font-bold text-slate-900">Workspace Details</h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Workspace Name</span>
              <span className="font-semibold text-slate-800 text-sm">{workspace.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Workspace Slug</span>
              <code className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono">
                {workspace.slug}
              </code>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Unique Identifier</span>
              <code className="text-slate-500 font-mono text-[11px]">{workspace.id}</code>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Created Date</span>
              <span className="text-slate-700">
                {new Date(workspace.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. MEMBERS TAB */}
      {activeTab === "members" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Workspace Members & Permissions</h3>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Access Role</th>
                  <th className="py-3 px-4">Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{m.user.name}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">{m.user.email}</td>
                    <td className="py-3.5 px-4 text-xs">
                      <Badge
                        variant={
                          m.role === "OWNER"
                            ? "blue"
                            : m.role === "ADMIN"
                            ? "purple"
                            : m.role === "MANAGER"
                            ? "amber"
                            : "slate"
                        }
                      >
                        {m.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      Scoped exclusively to {workspace.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. STAGES TAB */}
      {activeTab === "stages" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Pipeline Stages Configuration</h3>
            {canManageStages && (
              <Button size="sm" variant="primary" onClick={() => setIsAddStageOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Pipeline Stage
              </Button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Stage Name</th>
                  <th className="py-3 px-4">Color</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Active Deals</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stages.map((stage) => (
                  <tr key={stage.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 text-xs font-mono font-bold text-slate-400">
                      {stage.displayOrder}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span>{stage.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                      {stage.color}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {stage.isWon ? (
                        <Badge variant="green">Closed Won</Badge>
                      ) : stage.isLost ? (
                        <Badge variant="red">Closed Lost</Badge>
                      ) : (
                        <Badge variant="slate">In Progress</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700 text-xs">
                      {stage._count.deals}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {canManageStages && (
                        <button
                          onClick={() => handleDeleteStage(stage)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete stage safely"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Stage Modal */}
      <Modal isOpen={isAddStageOpen} onClose={() => setIsAddStageOpen(false)} title="New Pipeline Stage">
        <form onSubmit={handleCreateStage} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Stage Name *</label>
            <input
              type="text"
              required
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              placeholder="e.g. Contract In Review"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Color (Hex)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={stageColor}
                onChange={(e) => setStageColor(e.target.value)}
                className="w-10 h-10 rounded border border-slate-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={stageColor}
                onChange={(e) => setStageColor(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isWon}
                onChange={(e) => {
                  setIsWon(e.target.checked);
                  if (e.target.checked) setIsLost(false);
                }}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Mark as Closed Won stage</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isLost}
                onChange={(e) => {
                  setIsLost(e.target.checked);
                  if (e.target.checked) setIsWon(false);
                }}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span>Mark as Closed Lost stage</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsAddStageOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Add Stage
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
