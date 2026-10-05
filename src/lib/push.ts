import webpush from "web-push";
import { createAdminClient } from "./supabase/admin";

let configured: boolean | null = null;

// Configured on first use, not at import: a missing VAPID variable must disable
// push notifications, not crash the build or every route that imports this file.
function configurePush(): boolean {
  if (configured !== null) return configured;
  const subject = process.env.VAPID_MAILTO;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    console.warn("[push] VAPID_MAILTO / NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set — push notifications disabled");
    return (configured = false);
  }
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    return (configured = true);
  } catch (err) {
    console.error("[push] invalid VAPID configuration — push notifications disabled:", err);
    return (configured = false);
  }
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!configurePush()) return;

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs?.length) return;

  const message = JSON.stringify({ ...payload, icon: payload.icon ?? "/icon" });

  await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message
        )
        .catch(async (err) => {
          // Subscription expired or invalid — remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            await admin
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
        })
    )
  );
}
