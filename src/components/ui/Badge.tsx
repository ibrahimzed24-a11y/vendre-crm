import React from "react";
import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "blue" | "green" | "amber" | "red" | "purple" | "slate";
  className?: string;
}

export function Badge({ children, variant = "slate", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider",
        {
          "bg-blue-50 text-blue-700 border border-blue-200": variant === "blue",
          "bg-emerald-50 text-emerald-700 border border-emerald-200": variant === "green",
          "bg-amber-50 text-amber-700 border border-amber-200": variant === "amber",
          "bg-rose-50 text-rose-700 border border-rose-200": variant === "red",
          "bg-purple-50 text-purple-700 border border-purple-200": variant === "purple",
          "bg-slate-100 text-slate-700 border border-slate-200": variant === "slate",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
