"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export const NOTIFICATIONS_CHANGED = "notifications:changed";

/** Live count of the user's unread notifications. */
export function useUnreadCount(userId: string, initial = 0) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function refresh() {
      const { count: c } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null);
      if (!cancelled && c !== null) setCount(c);
    }

    refresh();
    const channel = supabase
      .channel(`unread-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, refresh)
      .subscribe();
    window.addEventListener(NOTIFICATIONS_CHANGED, refresh);

    return () => {
      cancelled = true;
      window.removeEventListener(NOTIFICATIONS_CHANGED, refresh);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return count;
}
