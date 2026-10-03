import { beforeEach, describe, expect, it, vi } from "vitest";

// 以替身取代登入、資料庫與 Next 快取，只驗證 Server Actions 的檢核流程
const { fnGetSession, objRepository, fnGetPhoneBySlug, fnRefresh } = vi.hoisted(() => ({
    fnGetSession: vi.fn(),
    objRepository: {
        addCartItem: vi.fn(),
        getCartCount: vi.fn(),
        removeCartItem: vi.fn(),
        setCartItemQuantity: vi.fn(),
    },
    fnGetPhoneBySlug: vi.fn(),
    fnRefresh: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({ auth: { getSession: fnGetSession } }));
vi.mock("@/lib/cart-repository", () => objRepository);
vi.mock("@/lib/phone-repository", () => ({ getPhoneBySlug: fnGetPhoneBySlug }));
vi.mock("next/cache", () => ({ refresh: fnRefresh }));

const { addToCartAction, getCartCountAction, removeFromCartAction, updateCartQuantityAction } = await import("@/app/cart/actions");

const STR_USER_ID = "11111111-1111-1111-1111-111111111111";

/**
 * 設定登入狀態
 * @param {boolean} _blnSignedIn 是否已登入
 * @returns {void}
 */
function setSignedIn(_blnSignedIn: boolean): void {
    fnGetSession.mockResolvedValue({ data: _blnSignedIn ? { user: { id: STR_USER_ID } } : null });
}

beforeEach(() => {
    vi.clearAllMocks();
    objRepository.getCartCount.mockResolvedValue(3);
    fnGetPhoneBySlug.mockResolvedValue({ slug: "pixel-10" });
});

describe("未登入", () => {
    beforeEach(() => setSignedIn(false));

    it("件數為 0，且不查資料庫", async () => {
        expect(await getCartCountAction()).toBe(0);
        expect(objRepository.getCartCount).not.toHaveBeenCalled();
    });

    it("加入、修改、移除一律回 unauthenticated，不寫入資料庫", async () => {
        expect(await addToCartAction("pixel-10", 1)).toEqual({ ok: false, reason: "unauthenticated" });
        expect(await updateCartQuantityAction("pixel-10", 2)).toEqual({ ok: false, reason: "unauthenticated" });
        expect(await removeFromCartAction("pixel-10")).toEqual({ ok: false, reason: "unauthenticated" });
        expect(objRepository.addCartItem).not.toHaveBeenCalled();
        expect(objRepository.setCartItemQuantity).not.toHaveBeenCalled();
        expect(objRepository.removeCartItem).not.toHaveBeenCalled();
    });
});

describe("已登入", () => {
    beforeEach(() => setSignedIn(true));

    it("取得件數時使用伺服器端 session 的會員 ID", async () => {
        expect(await getCartCountAction()).toBe(3);
        expect(objRepository.getCartCount).toHaveBeenCalledWith(STR_USER_ID);
    });

    it("加入購物車成功並回傳最新件數", async () => {
        expect(await addToCartAction("pixel-10", 2)).toEqual({ ok: true, count: 3 });
        expect(objRepository.addCartItem).toHaveBeenCalledWith(STR_USER_ID, "pixel-10", 2);
    });

    it.each([0, 100, 1.5, Number.NaN])("數量 %s 不合法時不寫入", async (_intQuantity) => {
        expect(await addToCartAction("pixel-10", _intQuantity)).toEqual({ ok: false, reason: "invalid-quantity" });
        expect(await updateCartQuantityAction("pixel-10", _intQuantity)).toEqual({ ok: false, reason: "invalid-quantity" });
        expect(objRepository.addCartItem).not.toHaveBeenCalled();
        expect(objRepository.setCartItemQuantity).not.toHaveBeenCalled();
    });

    it("不存在的手機回 not-found", async () => {
        fnGetPhoneBySlug.mockResolvedValue(null);
        expect(await addToCartAction("no-such-phone", 1)).toEqual({ ok: false, reason: "not-found" });
        expect(objRepository.addCartItem).not.toHaveBeenCalled();
    });

    it("修改數量成功時重新整理頁面；購物車沒有該手機時回 not-found", async () => {
        objRepository.setCartItemQuantity.mockResolvedValue(true);
        expect(await updateCartQuantityAction("pixel-10", 5)).toEqual({ ok: true, count: 3 });
        expect(fnRefresh).toHaveBeenCalledTimes(1);

        objRepository.setCartItemQuantity.mockResolvedValue(false);
        expect(await updateCartQuantityAction("pixel-10", 5)).toEqual({ ok: false, reason: "not-found" });
    });

    it("移除後重新整理頁面並回傳最新件數", async () => {
        expect(await removeFromCartAction("pixel-10")).toEqual({ ok: true, count: 3 });
        expect(objRepository.removeCartItem).toHaveBeenCalledWith(STR_USER_ID, "pixel-10");
        expect(fnRefresh).toHaveBeenCalledTimes(1);
    });
});
