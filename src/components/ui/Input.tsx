"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full rounded-xl border bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 transition",
              "border-gray-200 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100",
              "dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500",
              "dark:focus:border-orange-400 dark:focus:bg-slate-800 dark:focus:ring-orange-900/40",
              "disabled:opacity-50",
              icon && "pl-10",
              error && "border-red-400 focus:border-red-400 focus:ring-red-100 dark:border-red-500 dark:focus:ring-red-900/40",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
