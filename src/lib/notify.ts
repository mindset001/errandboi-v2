import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser, type PushPayload } from "@/lib/push";

export type NotificationType = "order" | "payment" | "refund" | "withdrawal" | "account";

/**
 * Record a notification in the user's in-app inbox and send a push to their
 * devices. Never throws: a notification problem must not fail the order,
 * payment or admin action that triggered it.
 */
export async function notifyUser(
  userId: string,
  n: PushPayload & { type: NotificationType }
): Promise<void> {
  try {
    const { error } = await createAdminClient().from("notifications").insert({
      user_id: userId,
      type: n.type,
      title: n.title,
      body: n.body,
      url: n.url ?? null,
    });
    if (error) console.error("[notify] could not save notification:", error.message);
  } catch (err) {
    console.error("[notify] could not save notification:", err);
  }

  try {
    await sendPushToUser(userId, n);
  } catch (err) {
    console.error("[notify] push failed:", err);
  }
}
