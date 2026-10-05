export async function verifyPaystackPayment(reference: string): Promise<boolean> {
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );
  const data = await res.json();
  return data.status === true && data.data?.status === "success";
}

export interface PaystackTransaction {
  status: string;
  amount: number;
  currency: string;
  reference: string;
  metadata?: { orderId?: string; paymentType?: string } | null;
}

export async function fetchPaystackTransaction(
  reference: string
): Promise<PaystackTransaction | null> {
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }, cache: "no-store" }
  );
  const data = await res.json().catch(() => null);
  if (!data?.status || !data.data) return null;
  return data.data as PaystackTransaction;
}

/** Full refund of a transaction. "Already refunded" counts as success so retries are safe. */
export async function refundPaystackTransaction(
  reference: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transaction: reference }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json().catch(() => ({}));
    if (data?.status === true) return { ok: true };
    const message: string = data?.message ?? `Paystack error (${res.status})`;
    if (/already.*(refund|reverse)/i.test(message)) return { ok: true };
    return { ok: false, error: message };
  } catch {
    return { ok: false, error: "Could not reach Paystack" };
  }
}

export function paystackAmountInKobo(naira: number): number {
  return naira * 100;
}
