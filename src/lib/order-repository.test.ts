import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { addCartItem, getCartCount } from "@/lib/cart-repository";
import { createOrderNo, objDummyCheckout, validateCheckoutForm, type CheckoutOrderData } from "@/lib/checkout";
import { getSql } from "@/lib/db";
import { cancelOrder, convertOrderRow, createOrderFromCart, getOrderByNo, getOrders } from "@/lib/order-repository";

// 訂單資料存取層整合測試：直接連 Neon，建立一位暫時的測試會員（e2e-*@example.com），測完刪除（訂單隨會員刪除）
const blnHasDatabase = Boolean(process.env.DATABASE_URL);

const objValidation = validateCheckoutForm(objDummyCheckout, new Date("2026-10-04T12:00:00+08:00"));
const objOrderData = (objValidation.ok ? objValidation.data : null) as CheckoutOrderData;

describe("convertOrderRow", () => {
    it("時間轉 ISO 字串、數值轉 number，未取消時 cancelledAt 為 null", () => {
        const objOrder = convertOrderRow({
            order_no: "MW20261004-AAAAAA",
            status: "PAID",
            recipient_name: "王小明",
            recipient_phone: "0912-345-678",
            shipping_address: "臺北市信義區示範路 100 號 5 樓",
            payment_method: "CREDIT_CARD",
            card_brand: "VISA",
            card_last4: "4242",
            total_twd: "43490" as unknown as number,
            created_at: new Date("2026-10-04T04:00:00Z"),
            cancelled_at: null,
            items: [{ phone_slug: "a", phone_name: "A", image_url: null, unit_price_twd: 100, quantity: 2 }],
        });
        expect(objOrder.totalTwd).toBe(43490);
        expect(objOrder.createdAt).toBe("2026-10-04T04:00:00.000Z");
        expect(objOrder.cancelledAt).toBeNull();
        expect(objOrder.items).toEqual([{ phoneSlug: "a", phoneName: "A", imageUrl: null, unitPriceTwd: 100, quantity: 2 }]);
    });
});

describe.skipIf(!blnHasDatabase)("order-repository（Neon）", () => {
    let strUserId = "";

    beforeAll(async () => {
        const arrRows = await getSql().query(
            `INSERT INTO neon_auth."user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
             VALUES (gen_random_uuid(), $1, $2, FALSE, NOW(), NOW())
             RETURNING id`,
            ["訂單測試", `e2e-vitest-order-${Date.now()}@example.com`],
        );
        strUserId = (arrRows[0] as { id: string }).id;
    });

    afterAll(async () => {
        await getSql().query('DELETE FROM neon_auth."user" WHERE id = $1', [strUserId]);
        const arrLeft = await getSql().query("SELECT 1 FROM TBL_ORDER WHERE USER_ID = $1", [strUserId]);
        expect(arrLeft).toHaveLength(0);
    });

    beforeEach(async () => {
        await getSql().query("DELETE FROM TBL_CART_ITEM WHERE USER_ID = $1", [strUserId]);
    });

    it("購物車轉成訂單：明細與總金額正確、購物車清空、只存卡號末四碼", async () => {
        await addCartItem(strUserId, "iphone-17-pro-max", 2);
        await addCartItem(strUserId, "pixel-10", 1);
        const strOrderNo = createOrderNo(new Date());

        expect(await createOrderFromCart(strUserId, strOrderNo, objOrderData)).toBe(true);
        expect(await getCartCount(strUserId)).toBe(0);

        const objOrder = await getOrderByNo(strUserId, strOrderNo);
        expect(objOrder).toMatchObject({
            orderNo: strOrderNo,
            status: "PAID",
            totalTwd: 43490 * 2 + 24990,
            cardBrand: "VISA",
            cardLast4: "4242",
            recipientName: "王小明",
            cancelledAt: null,
        });
        expect(objOrder?.items.map((_objItem) => [_objItem.phoneSlug, _objItem.quantity, _objItem.unitPriceTwd])).toEqual([
            ["pixel-10", 1, 24990],
            ["iphone-17-pro-max", 2, 43490],
        ]);
    });

    it("購物車是空的時候不建立訂單", async () => {
        const strOrderNo = createOrderNo(new Date());
        expect(await createOrderFromCart(strUserId, strOrderNo, objOrderData)).toBe(false);
        expect(await getOrderByNo(strUserId, strOrderNo)).toBeNull();
    });

    it("訂單編號重複時整筆交易失敗，購物車保留", async () => {
        await addCartItem(strUserId, "galaxy-s25", 1);
        const strOrderNo = createOrderNo(new Date());
        await createOrderFromCart(strUserId, strOrderNo, objOrderData);

        await addCartItem(strUserId, "galaxy-s25", 2);
        await expect(createOrderFromCart(strUserId, strOrderNo, objOrderData)).rejects.toThrow();
        expect(await getCartCount(strUserId)).toBe(2);
    });

    it("查不到別人的訂單", async () => {
        await addCartItem(strUserId, "galaxy-s25", 1);
        const strOrderNo = createOrderNo(new Date());
        await createOrderFromCart(strUserId, strOrderNo, objOrderData);

        expect(await getOrderByNo("00000000-0000-0000-0000-000000000000", strOrderNo)).toBeNull();
    });

    it("訂單列表新到舊；取消後狀態與取消時間更新，且不能重複取消", async () => {
        await addCartItem(strUserId, "galaxy-s25", 1);
        const strFirstNo = createOrderNo(new Date());
        await createOrderFromCart(strUserId, strFirstNo, objOrderData);
        await addCartItem(strUserId, "pixel-10", 1);
        const strSecondNo = createOrderNo(new Date());
        await createOrderFromCart(strUserId, strSecondNo, objOrderData);

        const arrNos = (await getOrders(strUserId)).map((_objOrder) => _objOrder.orderNo);
        expect(arrNos.indexOf(strSecondNo)).toBeLessThan(arrNos.indexOf(strFirstNo));

        expect(await cancelOrder(strUserId, strFirstNo)).toBe(true);
        const objCancelled = await getOrderByNo(strUserId, strFirstNo);
        expect(objCancelled?.status).toBe("CANCELLED");
        expect(objCancelled?.cancelledAt).not.toBeNull();
        expect(await cancelOrder(strUserId, strFirstNo)).toBe(false);
    });

    it("已出貨（下單滿 24 小時）的訂單不能取消；別人的訂單也不能取消", async () => {
        await addCartItem(strUserId, "galaxy-s25", 1);
        const strOrderNo = createOrderNo(new Date());
        await createOrderFromCart(strUserId, strOrderNo, objOrderData);

        expect(await cancelOrder("00000000-0000-0000-0000-000000000000", strOrderNo)).toBe(false);

        await getSql().query("UPDATE TBL_ORDER SET CREATED_AT = NOW() - INTERVAL '25 hours' WHERE ORDER_NO = $1", [strOrderNo]);
        expect(await cancelOrder(strUserId, strOrderNo)).toBe(false);
        expect((await getOrderByNo(strUserId, strOrderNo))?.status).toBe("PAID");
    });
});
