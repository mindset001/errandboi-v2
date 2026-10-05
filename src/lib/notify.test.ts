import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: () => ({ insert }) }) }));
vi.mock("@/lib/push", () => ({ sendPushToUser: vi.fn(async () => {}) }));

import { sendPushToUser } from "@/lib/push";
import { notifyUser } from "@/lib/notify";

beforeEach(() => { insert.mockReset(); vi.mocked(sendPushToUser).mockClear(); });

const n = { type: "order" as const, title: "Hi", body: "There", url: "/orders/1" };

describe("notifyUser", () => {
  it("saves to the inbox and sends a push", async () => {
    insert.mockResolvedValue({ error: null });
    await notifyUser("u1", n);
    expect(insert).toHaveBeenCalledWith({ user_id: "u1", type: "order", title: "Hi", body: "There", url: "/orders/1" });
    expect(sendPushToUser).toHaveBeenCalledWith("u1", n);
  });

  it("still sends the push if saving to the inbox fails", async () => {
    insert.mockResolvedValue({ error: { message: "relation does not exist" } });
    await expect(notifyUser("u1", n)).resolves.toBeUndefined();
    expect(sendPushToUser).toHaveBeenCalled();
  });

  it("never throws, even if both the insert and the push blow up", async () => {
    insert.mockRejectedValue(new Error("db down"));
    vi.mocked(sendPushToUser).mockRejectedValueOnce(new Error("push down"));
    await expect(notifyUser("u1", n)).resolves.toBeUndefined();
  });
});
