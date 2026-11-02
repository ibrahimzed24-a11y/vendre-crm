"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Building2, User, Target, Briefcase, CheckSquare, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { SearchResultItem } from "@/services/search.service";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  function getIcon(type: SearchResultItem["type"]) {
    switch (type) {
      case "organization":
        return <Building2 className="w-4 h-4 text-purple-600" />;
      case "contact":
        return <User className="w-4 h-4 text-blue-600" />;
      case "lead":
        return <Target className="w-4 h-4 text-amber-600" />;
      case "deal":
        return <Briefcase className="w-4 h-4 text-emerald-600" />;
      case "task":
        return <CheckSquare className="w-4 h-4 text-indigo-600" />;
      default:
        return <Search className="w-4 h-4 text-slate-400" />;
    }
  }

  function handleSelect(url: string) {
    onClose();
    router.push(url);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search organizations, contacts, leads, deals, tasks... (Press ESC to close)"
            className="w-full text-slate-800 placeholder-slate-400 focus:outline-none text-base bg-transparent"
          />
          {isLoading && <Loader2 className="w-4 h-4 text-blue-600 animate-spin ml-2" />}
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 p-2">
          {query.trim().length >= 2 && results.length === 0 && !isLoading && (
            <div className="py-8 text-center text-sm text-slate-500">
              No records found matching &quot;{query}&quot; in active workspace.
            </div>
          )}

          {results.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => handleSelect(item.url)}
              className="w-full text-left p-3 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-white group-hover:shadow-xs transition-colors">
                  {getIcon(item.type)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500">{item.subtitle}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
