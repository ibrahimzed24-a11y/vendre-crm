"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Building } from "lucide-react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";

interface WorkspaceMembershipOption {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  role: Role;
}

interface WorkspaceSwitcherProps {
  currentWorkspaceId: string;
  currentWorkspaceName: string;
  allMemberships: WorkspaceMembershipOption[];
}

export function WorkspaceSwitcher({
  currentWorkspaceId,
  currentWorkspaceName,
  allMemberships,
}: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSwitch(workspaceId: string) {
    if (workspaceId === currentWorkspaceId || isSwitching) return;
    setIsSwitching(true);
    try {
      const res = await fetch("/api/auth/switch-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      if (res.ok) {
        setIsOpen(false);
        window.location.href = "/";
      } else {
        alert("Failed to switch workspace.");
        setIsSwitching(false);
      }
    } catch {
      alert("Network error switching workspace.");
      setIsSwitching(false);
    }
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm font-medium shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Building className="w-4 h-4 text-blue-600" />
        <span className="font-semibold text-slate-900">{currentWorkspaceName}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 origin-top-left rounded-xl bg-white shadow-xl ring-1 ring-black/5 divide-y divide-slate-100 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-2.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Authorized Workspaces
            </p>
          </div>
          <div className="py-1">
            {allMemberships.map((m) => {
              const isActive = m.workspaceId === currentWorkspaceId;
              return (
                <button
                  key={m.workspaceId}
                  onClick={() => handleSwitch(m.workspaceId)}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    isActive ? "bg-blue-50/60 font-semibold text-blue-900" : "text-slate-700"
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{m.workspaceName}</span>
                    <span className="text-[11px] text-slate-400 font-normal uppercase">
                      {m.role}
                    </span>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
