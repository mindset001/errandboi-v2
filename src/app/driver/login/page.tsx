"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Tab = "login" | "signup";

export default function DriverLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

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
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, role: "driver" },
      },
    });
    if (error) { setLoading(false); setError(error.message); return; }

    // Auto-create pending driver record so admin and driver can both see it
    if (data.user) {
      await fetch("/api/driver/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id, fullName, phone }),
      });
    }

    setLoading(false);
    setSignedUp(true);
  }

  if (signedUp) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-slate-400 text-sm mb-4">
            We sent a confirmation link to <span className="text-white font-medium">{email}</span>.
            Click it to activate your account, then log in to complete your driver profile.
          </p>
          <button
            onClick={() => { setSignedUp(false); setTab("login"); }}
            className="mt-6 text-sm text-orange-400 hover:text-orange-300 transition"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
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
              onClick={() => { setTab(t); setError(""); }}
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
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 px-4 py-3 font-semibold text-white transition mt-1"
          >
            {loading
              ? tab === "login" ? "Signing in…" : "Creating account…"
              : tab === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {tab === "signup" && (
          <p className="text-center text-xs text-slate-500 mt-4 leading-relaxed">
            After creating your account, confirm your email then log in to complete your driver profile and KYC.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label, type, value, onChange, placeholder, required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-900/40 transition"
      />
    </div>
  );
}
