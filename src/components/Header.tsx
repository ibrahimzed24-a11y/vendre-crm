"use client";

import React, { useState } from "react";
import { Search, LogOut, User, Bell } from "lucide-react";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { Role } from "@prisma/client";

interface HeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  membership: {
    role: Role;
  };
  allMemberships: {
    workspaceId: string;
    workspaceName: string;
    workspaceSlug: string;
    role: Role;
  }[];
}

export function Header({ user, workspace, membership, allMemberships }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
        {/* Left: Workspace Switcher */}
        <div className="flex items-center gap-4">
          <WorkspaceSwitcher
            currentWorkspaceId={workspace.id}
            currentWorkspaceName={workspace.name}
            allMemberships={allMemberships}
          />
        </div>

        {/* Center: Global Search Trigger */}
        <div className="flex-1 max-w-md mx-6">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 text-sm text-slate-400 bg-slate-100 hover:bg-slate-200/80 rounded-lg border border-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span>Search anything in {workspace.name}...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-white rounded border border-slate-200">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Notifications & Profile Menu */}
        <div className="flex items-center gap-3">
          <button
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
          </button>

          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200">
                {user.name.charAt(0)}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-800 leading-tight">
                  {user.name}
                </span>
                <span className="text-[11px] text-slate-500">{membership.role}</span>
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl ring-1 ring-black/5 divide-y divide-slate-100 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 uppercase">
                    Role: {membership.role}
                  </span>
                </div>
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
