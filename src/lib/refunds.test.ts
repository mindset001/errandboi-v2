import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeAdmin } from "@/test/fake-supabase";

vi.mock("@/lib/paystack", () => ({ refundPaystackTransaction: vi.fn() }));

import { refundPaystackTransaction } from "@/lib/paystack";
import { refundOrder } from "@/lib/refunds";

const refund = vi.mocked(refundPaystackTransaction);
const paid = (over = {}) => ({
  id: "o1", payment_status: "paid", items_payment_status: "unpaid",
  payment_reference: "REF-FEE", items_payment_reference: null, refund_status: null, ...over,
});

beforeEach(() => { refund.mockReset(); refund.mockResolvedValue({ ok: true }); });

describe("refundOrder", () => {
  it("does nothing when nothing was paid", async () => {
    const rows = [paid({ payment_status: "unpaid" })];
    expect(await refundOrder(fakeAdmin(rows), "o1")).toEqual({ ok: true, refunded: 0 });
    expect(refund).not.toHaveBeenCalled();
  });

  it("refunds a paid leg and records it", async () => {
    const rows = [paid()];
    expect(await refundOrder(fakeAdmin(rows), "o1")).toEqual({ ok: true, refunded: 1 });
    expect(refund).toHaveBeenCalledWith("REF-FEE");
    expect(rows[0]).toMatchObject({ payment_status: "refunded", refund_status: "processed" });
  });

  it("refunds both legs of an errand", async () => {
    const rows = [paid({ items_payment_status: "paid", items_payment_reference: "REF-ITEMS" })];
    expect(await refundOrder(fakeAdmin(rows), "o1")).toMatchObject({ ok: true, refunded: 2 });
    expect(rows[0]).toMatchObject({ payment_status: "refunded", items_payment_status: "refunded" });
  });

  it("never refunds twice", async () => {
    const rows = [paid()];
    await refundOrder(fakeAdmin(rows), "o1");
    await refundOrder(fakeAdmin(rows), "o1");
    expect(refund).toHaveBeenCalledTimes(1);
  });

  it("does not start a refund another request already claimed", async () => {
    const rows = [paid({ refund_status: "pending" })];
    expect(await refundOrder(fakeAdmin(rows), "o1")).toEqual({ ok: true, refunded: 0 });
    expect(refund).not.toHaveBeenCalled();
  });

  it("marks a failed refund so an admin can retry it", async () => {
    refund.mockResolvedValue({ ok: false, error: "Insufficient balance" });
    const rows = [paid()];
    expect(await refundOrder(fakeAdmin(rows), "o1")).toMatchObject({ ok: false, refunded: 0 });
    expect(rows[0]).toMatchObject({ payment_status: "paid", refund_status: "failed", refund_error: "Insufficient balance" });

    refund.mockResolvedValue({ ok: true });
    expect(await refundOrder(fakeAdmin(rows), "o1")).toMatchObject({ ok: true, refunded: 1 });
    expect(rows[0]).toMatchObject({ payment_status: "refunded", refund_status: "processed" });
  });

  it("only force can retry one stuck in pending", async () => {
    const rows = [paid({ refund_status: "pending" })];
    await refundOrder(fakeAdmin(rows), "o1", true);
    expect(refund).toHaveBeenCalledTimes(1);
    expect(rows[0].refund_status).toBe("processed");
  });
});
