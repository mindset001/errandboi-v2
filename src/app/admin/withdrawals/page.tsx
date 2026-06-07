import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";
import { markPaid, rejectWithdrawal } from "./actions";

export const dynamic = "force-dynamic";

type Filter = "all" | "pending" | "paid" | "rejected";

export default async function WithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = (status ?? "pending") as Filter;

  const admin = createAdminClient();

  const query = admin
    .from("withdrawals")
    .select("id, amount, bank_name, account_number, account_name, status, admin_note, created_at, driver_id, drivers(full_name, phone)")
    .order("created_at", { ascending: false });

  if (filter !== "all") query.eq("status", filter);

  const { data: withdrawals } = await query;

  const { count: pendingCount } = await admin
    .from("withdrawals")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const tabs: { key: Filter; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "paid", label: "Paid" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">Withdrawal Requests</h1>
        <p className="text-slate-400 mt-1 text-sm">Review and process driver payout requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/admin/withdrawals?status=${t.key}`}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              filter === t.key
                ? "bg-orange-500 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {t.label}
            {t.key === "pending" && (pendingCount ?? 0) > 0 && (
              <span className="bg-white/20 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {pendingCount}
              </span>
            )}
          </a>
        ))}
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        {!withdrawals?.length ? (
          <div className="text-center py-16 text-slate-500">No {filter !== "all" ? filter : ""} withdrawal requests.</div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {withdrawals.map((w) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const driver = (w.drivers as any) ?? {};
              return (
                <div key={w.id} className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Driver + bank info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-white">{driver.full_name ?? "—"}</p>
                      <StatusBadge status={w.status} />
                    </div>
                    <p className="text-xs text-slate-400">{driver.phone}</p>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span><span className="text-slate-500">Bank:</span> {w.bank_name}</span>
                      <span><span className="text-slate-500">Acct:</span> {w.account_number}</span>
                      <span className="col-span-2"><span className="text-slate-500">Name:</span> {w.account_name}</span>
                    </div>
                    {w.admin_note && (
                      <p className="text-xs text-slate-400 mt-1.5 italic">Note: {w.admin_note}</p>
                    )}
                    <p className="text-xs text-slate-600 mt-1">
                      {new Date(w.created_at).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {/* Amount + actions */}
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <p className="text-2xl font-extrabold text-white">{formatCurrency(Number(w.amount))}</p>

                    {w.status === "pending" && (
                      <div className="flex flex-col gap-2 w-full sm:w-48">
                        <form
                          action={async (fd) => {
                            "use server";
                            await markPaid(w.id, fd.get("note") as string);
                          }}
                          className="flex flex-col gap-1.5"
                        >
                          <input
                            name="note"
                            placeholder="Note (optional)"
                            className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-green-400 w-full"
                          />
                          <button
                            type="submit"
                            className="rounded-xl bg-green-500 hover:bg-green-600 px-4 py-2 text-xs font-bold text-white transition"
                          >
                            ✓ Mark Paid
                          </button>
                        </form>

                        <form
                          action={async (fd) => {
                            "use server";
                            await rejectWithdrawal(w.id, fd.get("note") as string);
                          }}
                          className="flex flex-col gap-1.5"
                        >
                          <input
                            name="note"
                            placeholder="Reason (optional)"
                            className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-400 w-full"
                          />
                          <button
                            type="submit"
                            className="rounded-xl border border-red-500/40 hover:bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 transition"
                          >
                            ✕ Reject
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400",
    paid: "bg-green-500/15 text-green-400",
    rejected: "bg-red-500/15 text-red-400",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] ?? "bg-slate-700 text-slate-300"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
