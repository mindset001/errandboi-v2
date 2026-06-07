"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  const supabase = createClient();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
      setFieldErrors((p) => ({ ...p, [field]: "" }));
    };
  }

  async function handleSignup(e: { preventDefault(): void }) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    // Client-side password match check
    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      return;
    }
    if (form.password.length < 8) {
      setFieldErrors({ password: "Password must be at least 8 characters." });
      return;
    }

    setLoading(true);

    // Pre-flight duplicate check (email + phone)
    const checkRes = await fetch("/api/auth/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, phone: form.phone }),
    });
    const dupErrors = await checkRes.json();
    if (Object.keys(dupErrors).length > 0) {
      setFieldErrors(dupErrors);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, phone: form.phone } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
      });
    }
    setSuccess(true);
    setLoading(false);
  }

  const EyeToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button type="button" onClick={onToggle} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition focus:outline-none">
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white dark:from-slate-900 dark:to-slate-800 px-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-10 text-center max-w-md w-full">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Account created!</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6">Check your email to confirm your account, then sign in.</p>
          <Link href="/auth/login"><Button className="w-full">Go to Login</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white dark:from-slate-900 dark:to-slate-800 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">🛵</span>
            <span className="text-2xl font-extrabold text-orange-500">
              Errand<span className="text-gray-900 dark:text-slate-100">boi</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Create an account</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Start ordering in minutes</p>
        </div>

        <form onSubmit={handleSignup} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 flex flex-col gap-5">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <Input
            label="Full name"
            placeholder="John Doe"
            value={form.full_name}
            onChange={update("full_name")}
            icon={<User className="h-4 w-4" />}
            error={fieldErrors.full_name}
            required
          />
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={update("email")}
            icon={<Mail className="h-4 w-4" />}
            error={fieldErrors.email}
            required
          />
          <Input
            label="Phone number"
            type="tel"
            placeholder="+234 800 000 0000"
            value={form.phone}
            onChange={update("phone")}
            icon={<Phone className="h-4 w-4" />}
            error={fieldErrors.phone}
            required
          />
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={update("password")}
            icon={<Lock className="h-4 w-4" />}
            trailing={<EyeToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
            error={fieldErrors.password}
            minLength={8}
            required
          />
          <Input
            label="Confirm password"
            type={showConfirm ? "text" : "password"}
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
            icon={<Lock className="h-4 w-4" />}
            trailing={<EyeToggle show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />}
            error={fieldErrors.confirmPassword}
            required
          />

          <Button type="submit" loading={loading} className="mt-2">
            {loading ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-center text-sm text-gray-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-orange-500 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
