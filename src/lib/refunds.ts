import type { SupabaseClient } from "@supabase/supabase-js";
import { refundPaystackTransaction } from "@/lib/paystack";

export interface RefundResult {
  ok: boolean;
  refunded: number; // payment legs refunded in this call
  error?: string;
}

/**
 * Refunds every paid leg of an order. Idempotent: legs already refunded are
 * skipped, and a concurrent call is a no-op. Pass `force` (admin retry) to
 * re-run an order whose previous attempt is stuck in "pending" or "failed".
 */
export async function refundOrder(
  admin: SupabaseClient,
  orderId: string,
  force = false
): Promise<RefundResult> {
  const { data: order } = await admin
    .from("orders")
    .select("payment_status, items_payment_status, payment_reference, items_payment_reference, refund_status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { ok: false, refunded: 0, error: "Order not found" };

  const legs: { column: "payment_status" | "items_payment_status"; reference: string }[] = [];
  if (order.payment_status === "paid" && order.payment_reference) {
    legs.push({ column: "payment_status", reference: order.payment_reference });
  }
  if (order.items_payment_status === "paid" && order.items_payment_reference) {
    legs.push({ column: "items_payment_status", reference: order.items_payment_reference });
  }
  if (legs.length === 0) return { ok: true, refunded: 0 };

  // Claim the refund so two requests can't both pay it out.
  const claimable = force ? ["failed", "pending"] : ["failed"];
  let claim = admin.from("orders").update({ refund_status: "pending", refund_error: null }).eq("id", orderId);
  claim = order.refund_status === null
    ? claim.is("refund_status", null)
    : claim.in("refund_status", claimable);
  const { data: claimed } = await claim.select("id").maybeSingle();
  if (!claimed) return { ok: true, refunded: 0 };

  let refunded = 0;
  const errors: string[] = [];
  for (const leg of legs) {
    const result = await refundPaystackTransaction(leg.reference);
    if (result.ok) {
      await admin.from("orders").update({ [leg.column]: "refunded" }).eq("id", orderId).eq(leg.column, "paid");
      refunded += 1;
    } else {
      errors.push(result.error ?? "Refund failed");
    }
  }

  if (errors.length === 0) {
    await admin
      .from("orders")
      .update({ refund_status: "processed", refund_error: null, refunded_at: new Date().toISOString() })
      .eq("id", orderId);
    return { ok: true, refunded };
  }

  await admin
    .from("orders")
    .update({ refund_status: "failed", refund_error: errors.join("; ").slice(0, 500) })
    .eq("id", orderId);
  return { ok: false, refunded, error: errors.join("; ") };
}
