"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { CountPill } from "./UnreadBadge";
import { useUnreadCount } from "./useUnreadCount";

/** Mobile top-bar entry point to the notifications page. */
export default function NotificationBell({ userId, initialUnread }: { userId: string; initialUnread: number }) {
  const count = useUnreadCount(userId, initialUnread);
  return (
    <Link
      href="/notifications"
      aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
    >
      <Bell className="h-5 w-5" />
      <CountPill count={count} className="absolute -right-1 -top-1 min-w-4 h-4 px-1 text-[10px]" />
    </Link>
  );
}
