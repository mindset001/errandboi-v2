"use client";

import { cn } from "@/lib/utils";
import { useUnreadCount } from "./useUnreadCount";

export function CountPill({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} unread`}
      className={cn(
        "inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[11px] font-bold leading-none text-white",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function UnreadBadge({ userId, initial, className }: { userId: string; initial?: number; className?: string }) {
  const count = useUnreadCount(userId, initial);
  return <CountPill count={count} className={className} />;
}
