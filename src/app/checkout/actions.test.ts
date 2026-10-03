import { beforeEach, describe, expect, it, vi } from "vitest";
import { objDummyCheckout } from "@/lib/checkout";

// 以替身取代登入、資料庫與 Next 導頁，只驗證結帳流程
const { fnGetSession, fnCreateOrderFromCart, fnRedirect } = vi.hoisted(() => ({
    fnGetSession: vi.fn(),
    fnCreateOrderFromCart: vi.fn(),
    // redirect() 在 Next 中會拋出例外中斷流程，替身同樣拋出以便驗證
    fnRedirect: vi.fn((_strUrl: string) => {
        throw new Error(`REDIRECT:${_strUrl}`);
    }),
}));

vi.mock("@/lib/auth/server", () => ({ auth: { getSession: fnGetSession } }));
vi.mock("@/lib/order-repository", () => ({ createOrderFromCart: fnCreateOrderFromCart }));
vi.mock("next/navigation", () => ({ redirect: fnRedirect }));

const { placeOrderAction } = await import("@/app/checkout/actions");

const STR_USER_ID = "11111111-1111-1111-1111-111111111111";
const objInitialState = { message: "", errors: {} };

/**
 * 建立表單資料（預設為示範資料）
 * @param {Record<string, string>} _objOverrides 要覆寫的欄位
 * @returns {FormData} 表單資料
 */
function createFormData(_objOverrides: Record<string, string> = {}): FormData {
    const objFormData = new FormData();
    for (const [strKey, strValue] of Object.entries({ ...objDummyCheckout, ..._objOverrides })) {
        objFormData.set(strKey, strValue);
    }
    return objFormData;
}

beforeEach(() => {
    vi.clearAllMocks();
    fnGetSession.mockResolvedValue({ data: { user: { id: STR_USER_ID } } });
    fnCreateOrderFromCart.mockResolvedValue(true);
});

describe("placeOrderAction", () => {
    it("未登入導向登入頁，不建立訂單", async () => {
        fnGetSession.mockResolvedValue({ data: null });
        await expect(placeOrderAction(objInitialState, createFormData())).rejects.toThrow("REDIRECT:/auth/sign-in?redirectTo=%2Fcheckout");
        expect(fnCreateOrderFromCart).not.toHaveBeenCalled();
    });

    it("示範資料直接送出：建立訂單後導向訂單完成頁，資料庫只收到末四碼", async () => {
        await expect(placeOrderAction(objInitialState, createFormData())).rejects.toThrow(/^REDIRECT:\/checkout\/complete\/MW\d{8}-[A-Z2-9]{6}$/);

        const [strUserId, strOrderNo, objData] = fnCreateOrderFromCart.mock.calls[0];
        expect(strUserId).toBe(STR_USER_ID);
        expect(strOrderNo).toMatch(/^MW\d{8}-/);
        expect(objData).toMatchObject({ cardBrand: "VISA", cardLast4: "4242" });
        expect(JSON.stringify(objData)).not.toMatch(/4242424242424242|123|12\/30/);
    });

    it("欄位錯誤時回傳錯誤訊息，不建立訂單", async () => {
        const objState = await placeOrderAction(objInitialState, createFormData({ cardNumber: "4111111111111111", recipientPhone: "123" }));
        expect(objState.message).toBe("請修正標示的欄位");
        expect(Object.keys(objState.errors).sort()).toEqual(["cardNumber", "recipientPhone"]);
        expect(fnCreateOrderFromCart).not.toHaveBeenCalled();
    });

    it("缺少欄位視為空字串並回報錯誤", async () => {
        const objState = await placeOrderAction(objInitialState, new FormData());
        expect(Object.keys(objState.errors)).toContain("recipientName");
        expect(fnCreateOrderFromCart).not.toHaveBeenCalled();
    });

    it("購物車是空的時候回傳錯誤訊息", async () => {
        fnCreateOrderFromCart.mockResolvedValue(false);
        expect(await placeOrderAction(objInitialState, createFormData())).toEqual({ message: "購物車是空的，無法結帳", errors: {} });
    });
});

describe("placeOrderAction 保留輸入", () => {
    beforeEach(() => {
        fnGetSession.mockResolvedValue({ data: { user: { id: STR_USER_ID } } });
    });

    it("檢核失敗時回傳使用者輸入，但不回傳卡號與安全碼", async () => {
        const objState = await placeOrderAction(objInitialState, createFormData({ shippingAddress: "台北", cardNumber: "4111111111111111" }));
        expect(objState.values).toMatchObject({ shippingAddress: "台北", recipientName: "王小明", cardExpiry: "12/30" });
        expect(objState.values).not.toHaveProperty("cardNumber");
        expect(objState.values).not.toHaveProperty("cardCvc");
    });
});
