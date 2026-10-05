"use client";

import { Eye, EyeOff } from "lucide-react";

export default function PasswordToggleButton({
  shown,
  onToggle,
  className = "text-gray-400 hover:text-gray-600 dark:hover:text-slate-300",
}: {
  shown: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Hide password" : "Show password"}
      aria-pressed={shown}
      className={`transition focus:outline-none focus-visible:text-orange-500 ${className}`}
    >
      {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}
