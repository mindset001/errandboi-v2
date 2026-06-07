import { adminLogin } from "./actions";
import { Lock } from "lucide-react";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-2xl mb-4">
            🛵
          </div>
          <h1 className="text-2xl font-extrabold text-white">Admin Access</h1>
          <p className="text-slate-400 mt-1 text-sm">Errandboi Control Panel</p>
        </div>

        <form action={adminLogin} className="bg-slate-800 rounded-2xl border border-slate-700 p-8 flex flex-col gap-5">
          <AdminError searchParams={searchParams} />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">Admin Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-slate-600 bg-slate-700 pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-900/40 transition"
              />
            </div>
          </div>

          <SubmitButton
            pendingText="Verifying…"
            className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white hover:bg-orange-600"
          >
            Enter Admin Panel
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}

async function AdminError({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!error) return null;
  return (
    <div className="rounded-xl bg-red-900/30 border border-red-700 px-4 py-3 text-sm text-red-400">
      Incorrect password. Try again.
    </div>
  );
}
