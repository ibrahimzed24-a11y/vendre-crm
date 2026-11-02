"use client";

import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none",
          {
            "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm": variant === "primary",
            "bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-400 border border-slate-200":
              variant === "secondary",
            "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 shadow-sm": variant === "danger",
            "bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-300": variant === "ghost",
            "bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 focus:ring-blue-500 shadow-sm":
              variant === "outline",
          },
          {
            "px-2.5 py-1.5 text-xs gap-1.5": size === "sm",
            "px-4 py-2 text-sm gap-2": size === "md",
            "px-5 py-2.5 text-base gap-2.5": size === "lg",
          },
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
