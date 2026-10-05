"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import PasswordToggleButton from "@/components/ui/PasswordToggleButton";

export default function AdminPasswordField() {
  const [shown, setShown] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="admin-password" className="text-sm font-medium text-slate-300">Admin Password</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          id="admin-password"
          name="password"
          type={shown ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-slate-600 bg-slate-700 pl-10 pr-11 py-3 text-white placeholder-slate-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-900/40 transition"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          <PasswordToggleButton shown={shown} onToggle={() => setShown((v) => !v)} className="text-slate-500 hover:text-slate-300" />
        </span>
      </div>
    </div>
  );
}
