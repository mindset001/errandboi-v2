"use client";

import { postJson } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PasswordToggleButton from "@/components/ui/PasswordToggleButton";

export const dynamic = "force-dynamic";

type Tab = "login" | "signup";

export default function DriverLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: { preventDefault(): void }) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push("/driver/dashboard");
    router.refresh();
  }

  async function handleSignup(e: { preventDefault(): void }) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);

    // Create user via server-side admin API — no email verification required
    const res = await postJson("/api/driver/signup", { email, password, fullName, phone });
    const json = res.data;

    if (!res.ok || json.error) {
      setLoading(false);
      setError(json.error || "Something went wrong. Please try again.");
      return;
    }

    // User is confirmed — sign in immediately
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    router.push("/driver/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-2xl mb-4">
            🏍️
          </div>
          <h1 className="text-2xl font-extrabold text-white">Driver Portal</h1>
          <p className="text-slate-400 text-sm mt-1">ErrandBoi Driver App</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-900 rounded-xl p-1 mb-5 border border-slate-800">
          {(["login", "signup"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); setConfirmPassword(""); }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                tab === t
                  ? "bg-orange-500 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form
          onSubmit={tab === "login" ? handleLogin : handleSignup}
          className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col gap-4"
        >
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {tab === "signup" && (
            <>
              <Field label="Full name" type="text" value={fullName} onChange={setFullName} placeholder="John Okafor" required />
              <Field label="Phone number" type="tel" value={phone} onChange={setPhone} placeholder="+234 800 000 0000" required />
            </>
          )}

          <Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={tab === "signup" ? "Min. 8 characters" : "••••••••"}
            autoComplete={tab === "signup" ? "new-password" : "current-password"}
            required
          />
          {tab === "signup" && (
            <Field
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 px-4 py-3 font-semibold text-white transition mt-1"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {loading
              ? tab === "login" ? "Signing in…" : "Creating account…"
              : tab === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {tab === "signup" && (
          <p className="text-center text-xs text-slate-500 mt-4 leading-relaxed">
            After creating your account you&apos;ll be taken directly to complete your driver profile.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label, type, value, onChange, placeholder, required, autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  autoComplete?: string;
}) {
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <div className="relative">
        <input
          type={isPassword && shown ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-900/40 transition ${isPassword ? "pr-11" : ""}`}
        />
        {isPassword && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <PasswordToggleButton shown={shown} onToggle={() => setShown((v) => !v)} className="text-slate-500 hover:text-slate-300" />
          </span>
        )}
      </div>
    </div>
  );
}
