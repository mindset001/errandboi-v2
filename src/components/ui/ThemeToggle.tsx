"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

export default function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
        "bg-gray-100 text-gray-600 hover:bg-gray-200",
        "dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600",
        className
      )}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
