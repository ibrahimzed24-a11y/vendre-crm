"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, Building } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = "/";
      } else {
        setError(data.error || "Authentication failed.");
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  function fillDemo(userEmail: string) {
    setEmail(userEmail);
    setPassword("Vendre2025!");
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-2xl shadow-lg">
            V
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          VENDRE CRM
        </h2>
        <p className="mt-1 text-center text-xs font-medium text-slate-400">
          Private Sales CRM • Strict Workspace Isolation
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-4" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
              Sign In to Workspace
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          {/* Quick Demo Access Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemo("owner@vendre.com")}
                className="p-2 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
              >
                <div className="font-bold text-slate-800">Owner</div>
                <div className="text-[10px] text-slate-500">owner@vendre.com</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("admin@vendre.com")}
                className="p-2 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
              >
                <div className="font-bold text-slate-800">Admin</div>
                <div className="text-[10px] text-slate-500">admin@vendre.com</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("sales@vendre.com")}
                className="p-2 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
              >
                <div className="font-bold text-slate-800">Sales Rep</div>
                <div className="text-[10px] text-slate-500">sales@vendre.com</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("agency.lead@vendre.com")}
                className="p-2 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
              >
                <div className="font-bold text-slate-800">Agency Lead</div>
                <div className="text-[10px] text-slate-500">agency.lead@...</div>
              </button>
            </div>
            <div className="mt-3 text-center">
              <span className="text-[10px] text-slate-400">
                Default password: <code className="bg-slate-100 px-1 py-0.5 rounded">Vendre2025!</code>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
