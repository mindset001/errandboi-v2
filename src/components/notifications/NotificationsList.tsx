"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, CreditCard, Package, RotateCcw, Banknote, UserCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, timeAgo } from "@/lib/utils";
import { NOTIFICATIONS_CHANGED } from "./useUnreadCount";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string | null;
  read_at: string | null;
  created_at: string;
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  order: Package,
  payment: CreditCard,
  refund: RotateCcw,
  withdrawal: Banknote,
  account: UserCheck,
};

const LIMIT = 50;

/** Inbox shared by the customer page and the driver "Alerts" tab. */
export default function NotificationsList({ userId, dark = false }: { userId: string; dark?: boolean }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("notifications")
      .select("id, type, title, body, url, read_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(LIMIT)
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) setError("Could not load notifications. Please try again.");
        else { setError(""); setItems(data ?? []); }
        setLoading(false);
      });

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => setItems((prev) => [payload.new as Notification, ...prev].slice(0, LIMIT)))
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [supabase, userId, attempt]);

  const unread = items.filter((n) => !n.read_at).length;
  const visible = filter === "unread" ? items.filter((n) => !n.read_at) : items;

  async function markRead(ids: string[]) {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read_at: n.read_at ?? now } : n)));
    await supabase.from("notifications").update({ read_at: now }).in("id", ids).is("read_at", null);
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
  }

  async function markAllRead() {
    const ids = items.filter((n) => !n.read_at).map((n) => n.id);
    if (ids.length) await markRead(ids);
  }

  function open(n: Notification) {
    if (!n.read_at) markRead([n.id]);
    if (n.url) router.push(n.url);
  }

  const c = dark
    ? {
        card: "bg-slate-900 border-slate-800",
        row: "hover:bg-slate-800/60",
        unreadRow: "bg-orange-500/5",
        title: "text-white",
        body: "text-slate-400",
        muted: "text-slate-500",
        divide: "divide-slate-800",
        chipOn: "bg-orange-500 text-white",
        chipOff: "bg-slate-800 text-slate-400 hover:text-slate-200",
        icon: "bg-slate-800 text-orange-400",
        action: "text-orange-400 hover:text-orange-300",
      }
    : {
        card: "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700",
        row: "hover:bg-gray-50 dark:hover:bg-slate-700/40",
        unreadRow: "bg-orange-50/60 dark:bg-orange-500/5",
        title: "text-gray-900 dark:text-slate-100",
        body: "text-gray-500 dark:text-slate-400",
        muted: "text-gray-400 dark:text-slate-500",
        divide: "divide-gray-100 dark:divide-slate-700",
        chipOn: "bg-orange-500 text-white",
        chipOff: "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900",
        icon: "bg-orange-50 dark:bg-slate-700 text-orange-500",
        action: "text-orange-500 hover:text-orange-600",
      };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn("rounded-full px-3.5 py-1.5 text-sm font-medium transition capitalize", filter === f ? c.chipOn : c.chipOff)}
            >
              {f === "unread" && unread > 0 ? `Unread (${unread})` : f}
            </button>
          ))}
        </div>
        <button
          onClick={markAllRead}
          disabled={unread === 0}
          className={cn("inline-flex items-center gap-1.5 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed", c.action)}
        >
          <CheckCheck className="h-4 w-4" />
          <span className="hidden min-[400px]:inline">Mark all read</span>
        </button>
      </div>

      <div className={cn("rounded-2xl border shadow-sm overflow-hidden", c.card)}>
        {loading ? (
          <ul className={cn("divide-y", c.divide)} aria-busy="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex gap-3 p-4 animate-pulse">
                <div className={cn("h-10 w-10 rounded-xl", dark ? "bg-slate-800" : "bg-gray-100 dark:bg-slate-700")} />
                <div className="flex-1 space-y-2">
                  <div className={cn("h-3.5 w-1/3 rounded", dark ? "bg-slate-800" : "bg-gray-100 dark:bg-slate-700")} />
                  <div className={cn("h-3 w-3/4 rounded", dark ? "bg-slate-800" : "bg-gray-100 dark:bg-slate-700")} />
                </div>
              </li>
            ))}
          </ul>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button onClick={() => { setLoading(true); setAttempt((a) => a + 1); }} className={cn("text-sm font-semibold", c.action)}>Try again</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center">
            <div className={cn("mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl", c.icon)}>
              <Bell className="h-6 w-6" />
            </div>
            <p className={cn("font-semibold", c.title)}>{filter === "unread" ? "You're all caught up" : "No notifications yet"}</p>
            <p className={cn("text-sm mt-1", c.body)}>
              {filter === "unread" ? "Nothing new to read." : "Updates about your orders and payments will show up here."}
            </p>
          </div>
        ) : (
          <ul className={cn("divide-y", c.divide)}>
            {visible.map((n) => {
              const Icon = ICONS[n.type] ?? Bell;
              return (
                <li key={n.id}>
                  <button
                    onClick={() => open(n)}
                    className={cn("flex w-full items-start gap-3 p-4 text-left transition", c.row, !n.read_at && c.unreadRow)}
                  >
                    <span className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl", c.icon)}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className={cn("text-sm font-semibold break-words", c.title)}>{n.title}</span>
                        <span className={cn("flex-shrink-0 text-xs whitespace-nowrap", c.muted)}>{timeAgo(n.created_at)}</span>
                      </span>
                      <span className={cn("mt-0.5 block text-sm break-words", c.body)}>{n.body}</span>
                    </span>
                    {!n.read_at && <span className="mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-orange-500" aria-label="Unread" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {!loading && items.length >= LIMIT && (
        <p className={cn("text-center text-xs", c.muted)}>Showing your latest {LIMIT} notifications.</p>
      )}
    </div>
  );
}
