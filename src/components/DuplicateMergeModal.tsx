"use client";

import React, { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { mergeDuplicateRecordsAction, dismissDuplicateCandidateAction } from "@/app/actions/crm";
import { AlertTriangle, ArrowRight, GitMerge, CheckCircle2 } from "lucide-react";

interface DuplicateMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    id: string;
    entityType: "ORGANIZATION" | "CONTACT";
    matchReason: string;
    confidenceScore: number;
    primaryRecord: any;
    duplicateRecord: any;
  };
  onSuccess?: () => void;
}

export function DuplicateMergeModal({
  isOpen,
  onClose,
  candidate,
  onSuccess,
}: DuplicateMergeModalProps) {
  const [isMerging, setIsMerging] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOrg = candidate.entityType === "ORGANIZATION";
  const primary = candidate.primaryRecord;
  const duplicate = candidate.duplicateRecord;

  async function handleMerge() {
    setIsMerging(true);
    setError(null);
    try {
      const res = await mergeDuplicateRecordsAction({
        candidateId: candidate.id,
        entityType: candidate.entityType,
        primaryRecordId: primary.id,
        duplicateRecordId: duplicate.id,
      });

      if (res?.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError("Failed to execute merge.");
      }
    } catch (err: any) {
      setError(err.message || "Error merging records.");
    } finally {
      setIsMerging(false);
    }
  }

  async function handleDismiss() {
    setIsDismissing(true);
    setError(null);
    try {
      await dismissDuplicateCandidateAction(candidate.id);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to dismiss.");
    } finally {
      setIsDismissing(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Review & Merge Duplicate ${isOrg ? "Organization" : "Contact"}`}
      description="Consolidate duplicate records safely without losing relationships or sales data."
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Match Reason: {candidate.matchReason}</span>
          </div>
          <span className="font-bold px-2 py-0.5 rounded bg-amber-200/60">
            {candidate.confidenceScore}% Confidence
          </span>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-2 gap-4">
          {/* Primary Record */}
          <div className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Primary (Preserved)
              </span>
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block">Name:</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {isOrg ? primary.name : `${primary.firstName} ${primary.lastName}`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Email:</span>
                <span className="text-slate-700">{primary.email || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Phone:</span>
                <span className="text-slate-700">{primary.phone || "—"}</span>
              </div>
              {isOrg && (
                <div>
                  <span className="text-slate-400 block">Website:</span>
                  <span className="text-slate-700">{primary.website || "—"}</span>
                </div>
              )}
            </div>
          </div>

          {/* Duplicate Record */}
          <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Duplicate (Merged & Removed)
              </span>
              <GitMerge className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block">Name:</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {isOrg ? duplicate.name : `${duplicate.firstName} ${duplicate.lastName}`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Email:</span>
                <span className="text-slate-700">{duplicate.email || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Phone:</span>
                <span className="text-slate-700">{duplicate.phone || "—"}</span>
              </div>
              {isOrg && (
                <div>
                  <span className="text-slate-400 block">Website:</span>
                  <span className="text-slate-700">{duplicate.website || "—"}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
          Merging will transfer all dependent leads, deals, contacts, activities, tasks, and
          notes to the Primary record inside a transactional database commit. The duplicate record
          will be safely removed.
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDismiss}
            isLoading={isDismissing}
            disabled={isMerging}
            className="text-slate-500"
          >
            Dismiss Match
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isMerging}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleMerge}
              isLoading={isMerging}
            >
              <GitMerge className="w-4 h-4 mr-1.5" />
              Confirm Merge
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
