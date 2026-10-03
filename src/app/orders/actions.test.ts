import { beforeEach, describe, expect, it, vi } from "vitest";

// 以替身取代登入、資料庫與 Next 快取，只驗證取消訂單流程
const { fnGetSession, fnCancelOrder, fnRefresh } = vi.hoisted(() => ({
    fnGetSession: vi.fn(),
    fnCancelOrder: vi.fn(),
    fnRefresh: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({ auth: { getSession: fnGetSession } }));
vi.mock("@/lib/order-repository", () => ({ cancelOrder: fnCancelOrder }));
vi.mock("next/cache", () => ({ refresh: fnRefresh }));

const { cancelOrderAction } = await import("@/app/orders/actions");

const STR_USER_ID = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
    vi.clearAllMocks();
    fnGetSession.mockResolvedValue({ data: { user: { id: STR_USER_ID } } });
    fnCancelOrder.mockResolvedValue(true);
});

describe("cancelOrderAction", () => {
    it("未登入回 unauthenticated，不呼叫資料庫", async () => {
        fnGetSession.mockResolvedValue({ data: null });
        expect(await cancelOrderAction("MW20261004-AAAAAA")).toEqual({ ok: false, reason: "unauthenticated" });
        expect(fnCancelOrder).not.toHaveBeenCalled();
    });

    it("成功取消後重新整理頁面", async () => {
        expect(await cancelOrderAction("MW20261004-AAAAAA")).toEqual({ ok: true });
        expect(fnCancelOrder).toHaveBeenCalledWith(STR_USER_ID, "MW20261004-AAAAAA");
        expect(fnRefresh).toHaveBeenCalledTimes(1);
    });

    it("已出貨、已取消或不是自己的訂單回 not-cancellable", async () => {
        fnCancelOrder.mockResolvedValue(false);
        expect(await cancelOrderAction("MW20261004-AAAAAA")).toEqual({ ok: false, reason: "not-cancellable" });
        expect(fnRefresh).not.toHaveBeenCalled();
    });

    it("訂單編號不是字串時直接拒絕", async () => {
        expect(await cancelOrderAction(123 as unknown as string)).toEqual({ ok: false, reason: "not-cancellable" });
        expect(fnCancelOrder).not.toHaveBeenCalled();
    });
});
