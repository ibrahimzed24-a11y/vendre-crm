"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Target,
  Kanban,
  Briefcase,
  CalendarCheck,
  CheckSquare,
  SearchCheck,
  Copy,
  BarChart3,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Role } from "@prisma/client";
import clsx from "clsx";

interface SidebarProps {
  userRole: Role;
  workspaceName: string;
}

export function Sidebar({ userRole, workspaceName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Organizations", href: "/organizations", icon: Building2 },
    { label: "Contacts", href: "/contacts", icon: Users },
    { label: "Leads", href: "/leads", icon: Target },
    { label: "Pipeline", href: "/pipeline", icon: Kanban },
    { label: "Deals", href: "/deals", icon: Briefcase },
    { label: "Activities", href: "/activities", icon: CalendarCheck },
    { label: "Tasks", href: "/tasks", icon: CheckSquare },
    { label: "Research", href: "/research", icon: SearchCheck },
    { label: "Duplicates", href: "/duplicates", icon: Copy },
    { label: "Reports", href: "/reports", icon: BarChart3 },
    ...(userRole === "OWNER" || userRole === "ADMIN"
      ? [{ label: "Audit Logs", href: "/audit-logs", icon: ShieldAlert }]
      : []),
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside
      className={clsx(
        "h-screen bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-all duration-300 relative select-none",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!collapsed ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-lg tracking-wider shadow-sm">
              V
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-sm tracking-wide">VENDRE CRM</span>
              <span className="text-[10px] text-blue-400 font-semibold truncate max-w-[130px]">
                {workspaceName}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-blue-600 mx-auto flex items-center justify-center font-black text-white text-lg">
            V
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={clsx(
            "p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors",
            collapsed && "mx-auto mt-1"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={clsx(
                  "w-5 h-5 flex-shrink-0 transition-colors",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Workspace Indicator Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Access Tier</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-400 font-semibold uppercase text-[10px]">
              {userRole}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
