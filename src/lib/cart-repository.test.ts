import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { INT_MAX_CART_QUANTITY } from "@/lib/cart";
import { addCartItem, getCartCount, getCartItems, removeCartItem, setCartItemQuantity } from "@/lib/cart-repository";
import { getSql } from "@/lib/db";

// 購物車資料存取層整合測試：直接連 Neon，建立一位暫時的測試會員（e2e-*@example.com），測完刪除
// 未設定 DATABASE_URL 時整組略過
const blnHasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!blnHasDatabase)("cart-repository（Neon）", () => {
    let strUserId = "";

    beforeAll(async () => {
        const arrRows = await getSql().query(
            `INSERT INTO neon_auth."user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
             VALUES (gen_random_uuid(), $1, $2, FALSE, NOW(), NOW())
             RETURNING id`,
            ["購物車測試", `e2e-vitest-cart-${Date.now()}@example.com`],
        );
        strUserId = (arrRows[0] as { id: string }).id;
    });

    afterAll(async () => {
        // 外鍵 ON DELETE CASCADE：刪除會員時購物車一併刪除
        await getSql().query('DELETE FROM neon_auth."user" WHERE id = $1', [strUserId]);
        const arrLeft = await getSql().query("SELECT 1 FROM TBL_CART_ITEM WHERE USER_ID = $1", [strUserId]);
        expect(arrLeft).toHaveLength(0);
    });

    beforeEach(async () => {
        await getSql().query("DELETE FROM TBL_CART_ITEM WHERE USER_ID = $1", [strUserId]);
    });

    it("空購物車：沒有項目、總件數 0", async () => {
        expect(await getCartItems(strUserId)).toEqual([]);
        expect(await getCartCount(strUserId)).toBe(0);
    });

    it("加入購物車後可讀回手機資料與數量，總件數為數量加總", async () => {
        expect(await addCartItem(strUserId, "iphone-17-pro-max", 2)).toBe(2);
        expect(await addCartItem(strUserId, "pixel-10", 1)).toBe(1);

        const arrItems = await getCartItems(strUserId);
        expect(arrItems.map((_objItem) => [_objItem.phoneSlug, _objItem.quantity])).toEqual([
            ["iphone-17-pro-max", 2],
            ["pixel-10", 1],
        ]);
        expect(arrItems[0]).toMatchObject({
            phoneName: "iPhone 17 Pro Max",
            unitPriceTwd: 43490,
            imageUrl: "/images/phones/iphone-17-pro-max.jpg",
        });
        expect(typeof arrItems[0].unitPriceTwd).toBe("number");
        expect(await getCartCount(strUserId)).toBe(3);
    });

    it("同一支手機重複加入時累加數量，最多 99", async () => {
        await addCartItem(strUserId, "galaxy-s25", 3);
        expect(await addCartItem(strUserId, "galaxy-s25", 4)).toBe(7);
        expect(await addCartItem(strUserId, "galaxy-s25", 98)).toBe(INT_MAX_CART_QUANTITY);
        expect(await getCartItems(strUserId)).toHaveLength(1);
    });

    it("修改數量；購物車沒有這支手機時回傳 false", async () => {
        await addCartItem(strUserId, "galaxy-s25", 1);
        expect(await setCartItemQuantity(strUserId, "galaxy-s25", 5)).toBe(true);
        expect(await getCartCount(strUserId)).toBe(5);
        expect(await setCartItemQuantity(strUserId, "pixel-10", 5)).toBe(false);
    });

    it("移除項目；重複移除回傳 false", async () => {
        await addCartItem(strUserId, "galaxy-s25", 1);
        expect(await removeCartItem(strUserId, "galaxy-s25")).toBe(true);
        expect(await removeCartItem(strUserId, "galaxy-s25")).toBe(false);
        expect(await getCartCount(strUserId)).toBe(0);
    });

    it("數量不合法時拋出錯誤且不寫入", async () => {
        await expect(addCartItem(strUserId, "galaxy-s25", 0)).rejects.toThrow(RangeError);
        await expect(addCartItem(strUserId, "galaxy-s25", 100)).rejects.toThrow(RangeError);
        await expect(setCartItemQuantity(strUserId, "galaxy-s25", 1.5)).rejects.toThrow(RangeError);
        expect(await getCartCount(strUserId)).toBe(0);
    });

    it("不存在的手機代碼被外鍵擋下", async () => {
        await expect(addCartItem(strUserId, "no-such-phone", 1)).rejects.toThrow();
    });

    it("不同會員的購物車互不影響", async () => {
        await addCartItem(strUserId, "galaxy-s25", 2);
        expect(await getCartCount("00000000-0000-0000-0000-000000000000")).toBe(0);
    });
});
