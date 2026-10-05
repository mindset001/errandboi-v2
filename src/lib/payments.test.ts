import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeAdmin } from "@/test/fake-supabase";

vi.mock("@/lib/paystack", () => ({ refundPaystackTransaction: vi.fn(async () => ({ ok: true })) }));

import { refundPaystackTransaction } from "@/lib/paystack";
import { applyPayment, expectedNaira } from "@/lib/payments";

const ride = () => ({
  id: "o1", order_type: "ride", status: "pending", fare: 1950, total: null, service_fee: null,
  payment_status: "unpaid", items_payment_status: null, payment_reference: "REF-RIDE-1", items_payment_reference: null,
});
const errand = () => ({
  id: "o2", order_type: "errand", status: "pending", fare: null, total: 5500, service_fee: 500,
  payment_status: "unpaid", items_payment_status: "unpaid", payment_reference: "REF-FEE-2", items_payment_reference: "REF-ITEMS-2",
});
const tx = (amount: number, over = {}) => ({ status: "success", amount, currency: "NGN", ...over });

beforeEach(() => vi.clearAllMocks());

describe("expectedNaira", () => {
  it("charges the fare for rides", () => expect(expectedNaira(ride(), "order")).toBe(1950));
  it("charges the service fee upfront for errands", () => expect(expectedNaira(errand(), "order")).toBe(500));
  it("charges total minus service fee for the items leg", () => expect(expectedNaira(errand(), "items")).toBe(5000));
  it("defaults the service fee to 500", () => {
    expect(expectedNaira({ ...errand(), service_fee: null }, "items")).toBe(5000);
  });
});

describe("applyPayment", () => {
  it("marks a ride paid when the amount matches", async () => {
    const rows = [ride()];
    const r = await applyPayment(fakeAdmin(rows), rows[0], "order", "REF-RIDE-1", tx(195_000));
    expect(r).toEqual({ ok: true });
    expect(rows[0].payment_status).toBe("paid");
  });

  it("rejects an underpayment — the ₦100-for-a-₦1,950-ride attack", async () => {
    const rows = [ride()];
    const r = await applyPayment(fakeAdmin(rows), rows[0], "order", "REF-RIDE-1", tx(10_000));
    expect(r).toMatchObject({ ok: false, status: 402 });
    expect(rows[0].payment_status).toBe("unpaid");
  });

  it("rejects the wrong currency and unsuccessful transactions", async () => {
    const rows = [ride()];
    expect(await applyPayment(fakeAdmin(rows), rows[0], "order", "REF-RIDE-1", tx(195_000, { currency: "USD" })))
      .toMatchObject({ ok: false, status: 402 });
    expect(await applyPayment(fakeAdmin(rows), rows[0], "order", "REF-RIDE-1", tx(195_000, { status: "failed" })))
      .toMatchObject({ ok: false, status: 402 });
    expect(rows[0].payment_status).toBe("unpaid");
  });

  it("rejects a reference already attached to a different order", async () => {
    const rows = [ride(), { ...ride(), id: "other", payment_reference: "REF-RIDE-1", payment_status: "paid" }];
    const r = await applyPayment(fakeAdmin(rows), rows[0], "order", "REF-RIDE-1", tx(195_000));
    expect(r).toMatchObject({ ok: false, status: 409 });
    expect(rows[0].payment_status).toBe("unpaid");
  });

  it("settles the two errand legs independently", async () => {
    const rows = [errand()];
    expect(await applyPayment(fakeAdmin(rows), rows[0], "order", "REF-FEE-2", tx(50_000))).toEqual({ ok: true });
    expect(rows[0]).toMatchObject({ payment_status: "paid", items_payment_status: "unpaid" });
    // paying the items leg with the fee amount must fail
    expect(await applyPayment(fakeAdmin(rows), rows[0], "items", "REF-ITEMS-2", tx(50_000)))
      .toMatchObject({ ok: false, status: 402 });
    expect(await applyPayment(fakeAdmin(rows), rows[0], "items", "REF-ITEMS-2", tx(500_000))).toEqual({ ok: true });
    expect(rows[0].items_payment_status).toBe("paid");
  });

  it("is idempotent for an already-paid order", async () => {
    const rows = [{ ...ride(), payment_status: "paid" }];
    expect(await applyPayment(fakeAdmin(rows), rows[0], "order", "REF-RIDE-1", tx(1))).toEqual({ ok: true });
  });

  it("refunds instead of accepting a payment for a cancelled order", async () => {
    const rows = [{ ...ride(), status: "cancelled" }];
    const r = await applyPayment(fakeAdmin(rows), rows[0], "order", "REF-RIDE-1", tx(195_000));
    expect(r).toMatchObject({ ok: false, status: 409 });
    expect(refundPaystackTransaction).toHaveBeenCalledWith("REF-RIDE-1");
    expect(rows[0].payment_status).toBe("unpaid");
  });

  it("rejects malformed references before they reach a query filter", async () => {
    const rows = [ride()];
    const r = await applyPayment(fakeAdmin(rows), rows[0], "order", "a,payment_status.eq.paid", tx(195_000));
    expect(r).toMatchObject({ ok: false, status: 400 });
  });
});
