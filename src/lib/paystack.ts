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

export function paystackAmountInKobo(naira: number): number {
  return naira * 100;
}
