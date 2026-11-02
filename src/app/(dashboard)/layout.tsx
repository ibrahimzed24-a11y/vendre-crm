import React from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAuthenticatedWorkspaceContext();
  if (!ctx) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar userRole={ctx.membership.role} workspaceName={ctx.workspace.name} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          user={ctx.user}
          workspace={ctx.workspace}
          membership={ctx.membership}
          allMemberships={ctx.allMemberships}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
