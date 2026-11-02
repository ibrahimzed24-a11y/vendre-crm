"use client";

import React, { useState } from "react";
import { GitMerge, Scan, CheckCircle2, AlertTriangle, Building, User, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DuplicateMergeModal } from "@/components/DuplicateMergeModal";
import { triggerScanDuplicatesAction, dismissDuplicateCandidateAction } from "@/app/actions/crm";
import { Role } from "@prisma/client";

interface CandidateItem {
  id: string;
  entityType: "ORGANIZATION" | "CONTACT";
  matchReason: string;
  confidenceScore: number;
  status: string;
  primaryRecord: any;
  duplicateRecord: any;
}

interface DuplicatesClientProps {
  candidates: CandidateItem[];
  userRole: Role;
}

export function DuplicatesClient({ candidates, userRole }: DuplicatesClientProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateItem | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const canMerge = ["OWNER", "ADMIN", "MANAGER"].includes(userRole);

  async function handleScan() {
    setIsScanning(true);
    try {
      await triggerScanDuplicatesAction();
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to scan for duplicates.");
    } finally {
      setIsScanning(false);
    }
  }

  async function handleDismiss(id: string) {
    try {
      await dismissDuplicateCandidateAction(id);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Failed to dismiss match.");
    }
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Duplicate Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify and merge duplicate companies and contacts safely without losing deals or history.
          </p>
        </div>

        {canMerge && (
          <Button variant="primary" size="sm" onClick={handleScan} isLoading={isScanning}>
            <Scan className="w-4 h-4 mr-1" />
            Scan Active Workspace
          </Button>
        )}
      </div>

      {/* Candidate List */}
      <div className="space-y-3">
        {candidates.map((c) => {
          const isOrg = c.entityType === "ORGANIZATION";
          const pName = isOrg
            ? c.primaryRecord.name
            : `${c.primaryRecord.firstName} ${c.primaryRecord.lastName}`;
          const dName = isOrg
            ? c.duplicateRecord.name
            : `${c.duplicateRecord.firstName} ${c.duplicateRecord.lastName}`;

          return (
            <div
              key={c.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="amber">{c.confidenceScore}% Match</Badge>
                  <span className="text-xs font-semibold uppercase text-slate-400">
                    {c.entityType}
                  </span>
                  <span className="text-xs text-slate-500">• {c.matchReason}</span>
                </div>

                <div className="flex items-center gap-4 text-sm font-semibold text-slate-800">
                  <div className="flex items-center gap-1.5 text-blue-600">
                    {isOrg ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    <span>{pName}</span>
                    <span className="text-xs font-normal text-slate-400">
                      ({c.primaryRecord.email || "No email"})
                    </span>
                  </div>

                  <span className="text-slate-300 font-normal">vs</span>

                  <div className="flex items-center gap-1.5 text-slate-700">
                    {isOrg ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    <span>{dName}</span>
                    <span className="text-xs font-normal text-slate-400">
                      ({c.duplicateRecord.email || "No email"})
                    </span>
                  </div>
                </div>
              </div>

              {canMerge && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDismiss(c.id)}
                    className="text-slate-500"
                  >
                    Dismiss
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedCandidate(c)}
                  >
                    <GitMerge className="w-3.5 h-3.5 mr-1" />
                    Review & Merge
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {candidates.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Duplicate Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Your database contacts and organizations are distinct and clean. Click &quot;Scan Active Workspace&quot; anytime to re-evaluate.
            </p>
            {canMerge && (
              <Button variant="outline" size="sm" onClick={handleScan} isLoading={isScanning}>
                Run Scan Now
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Review & Merge Modal */}
      {selectedCandidate && (
        <DuplicateMergeModal
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          candidate={selectedCandidate}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}
