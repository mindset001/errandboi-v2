import type { SupabaseClient } from "@supabase/supabase-js";
import { refundPaystackTransaction } from "@/lib/paystack";

export const SERVICE_FEE = 500;

export type PaymentType = "order" | "items";

interface PayableOrder {
  id: string;
  order_type: string;
  fare: number | null;
  total: number | null;
  service_fee: number | null;
  payment_status: string;
  items_payment_status: string | null;
  status?: string;
}

/** Naira amount the customer owes for the given payment leg. */
export function expectedNaira(order: PayableOrder, type: PaymentType): number {
  const serviceFee = Number(order.service_fee ?? SERVICE_FEE);
  if (type === "items") return Math.max(0, Number(order.total ?? 0) - serviceFee);
  return order.order_type === "ride" ? Number(order.fare ?? 0) : serviceFee;
}

interface Transaction {
  status: string;
  amount: number; // kobo
  currency: string;
}

type Result = { ok: true } | { ok: false; error: string; status: number };

/**
 * Marks a payment leg as paid after checking the Paystack transaction against
 * what the order actually costs, and that the reference isn't used elsewhere.
 */
export async function applyPayment(
  admin: SupabaseClient,
  order: PayableOrder,
  type: PaymentType,
  reference: string,
  tx: Transaction
): Promise<Result> {
  // Reference is interpolated into a PostgREST filter below — keep it strictly tokenlike.
  if (!/^[A-Za-z0-9_.=-]{6,100}$/.test(reference)) {
    return { ok: false, error: "Invalid payment reference", status: 400 };
  }

  const alreadyPaid =
    type === "items" ? order.items_payment_status === "paid" : order.payment_status === "paid";
  if (alreadyPaid) return { ok: true };

  // Paid after the order was cancelled (e.g. popup left open): give it straight back.
  if (order.status === "cancelled" && tx.status === "success") {
    await refundPaystackTransaction(reference);
    return { ok: false, error: "This order was cancelled; your payment is being refunded", status: 409 };
  }

  if (tx.status !== "success") return { ok: false, error: "Payment not successful", status: 402 };
  if (tx.currency !== "NGN") return { ok: false, error: "Unexpected currency", status: 402 };

  const expected = expectedNaira(order, type);
  if (expected <= 0 || tx.amount !== Math.round(expected * 100)) {
    return { ok: false, error: "Paid amount does not match order amount", status: 402 };
  }

  // A reference may settle exactly one payment leg of one order.
  const { data: clash } = await admin
    .from("orders")
    .select("id")
    .or(`payment_reference.eq.${reference},items_payment_reference.eq.${reference}`)
    .neq("id", order.id)
    .limit(1);
  if (clash && clash.length > 0) {
    return { ok: false, error: "Payment reference already used", status: 409 };
  }

  const fields =
    type === "items"
      ? { items_payment_status: "paid", items_payment_reference: reference }
      : { payment_status: "paid", payment_reference: reference };

  const { error } = await admin
    .from("orders")
    .update(fields)
    .eq("id", order.id)
    .eq(type === "items" ? "items_payment_status" : "payment_status", "unpaid");

  if (error) return { ok: false, error: error.message, status: 500 };
  return { ok: true };
}
