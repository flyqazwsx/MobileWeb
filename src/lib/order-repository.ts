/*
MobileWeb Order Repository
名稱：訂單資料存取層
說明：結帳時把購物車轉成訂單，並查詢訂單。呼叫端負責確認登入並傳入會員 ID。
      建立訂單、寫入明細、清空購物車在同一個交易（REPEATABLE READ）內完成，避免重複下單或購物車殘留

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／結帳]
*/

import type { CheckoutOrderData } from "@/lib/checkout";
import { getSql } from "@/lib/db";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";

/** 訂單主檔資料列（PostgreSQL 欄位名稱為小寫） */
export interface OrderRow {
    order_no: string;
    status: OrderStatus;
    recipient_name: string;
    recipient_phone: string;
    shipping_address: string;
    payment_method: "CREDIT_CARD";
    card_brand: string;
    card_last4: string;
    total_twd: number;
    created_at: Date | string;
    cancelled_at: Date | string | null;
    items: Array<{ phone_slug: string; phone_name: string; image_url: string | null; unit_price_twd: number; quantity: number }>;
}

/** 訂單查詢共用欄位：主檔 + 明細陣列 */
export const STR_ORDER_SELECT = `
    SELECT O.ORDER_NO, O.STATUS, O.RECIPIENT_NAME, O.RECIPIENT_PHONE, O.SHIPPING_ADDRESS, O.PAYMENT_METHOD,
           O.CARD_BRAND, O.CARD_LAST4, O.TOTAL_TWD, O.CREATED_AT, O.CANCELLED_AT,
           COALESCE((
               SELECT JSON_AGG(JSON_BUILD_OBJECT(
                   'phone_slug', I.PHONE_SLUG, 'phone_name', I.PHONE_NAME, 'image_url', I.IMAGE_URL,
                   'unit_price_twd', I.UNIT_PRICE_TWD, 'quantity', I.QUANTITY
               ) ORDER BY I.PHONE_NAME)
               FROM TBL_ORDER_ITEM I
               WHERE I.ORDER_ID = O.ORDER_ID
           ), '[]'::JSON) AS ITEMS
    FROM TBL_ORDER O`;

/**
 * 時間欄位轉 ISO 字串
 * @param {Date | string} _unkValue 資料庫回傳的時間
 * @returns {string} ISO 8601 字串
 */
function toIsoString(_unkValue: Date | string): string {
    return new Date(_unkValue).toISOString();
}

/**
 * 訂單資料列轉為訂單物件
 * @param {OrderRow} _objRow 資料列
 * @returns {Order} 訂單
 */
export function convertOrderRow(_objRow: OrderRow): Order {
    return {
        orderNo: _objRow.order_no,
        status: _objRow.status,
        recipientName: _objRow.recipient_name,
        recipientPhone: _objRow.recipient_phone,
        shippingAddress: _objRow.shipping_address,
        paymentMethod: _objRow.payment_method,
        cardBrand: _objRow.card_brand,
        cardLast4: _objRow.card_last4,
        totalTwd: Number(_objRow.total_twd),
        createdAt: toIsoString(_objRow.created_at),
        cancelledAt: _objRow.cancelled_at === null ? null : toIsoString(_objRow.cancelled_at),
        items: _objRow.items.map(
            (_objItem): OrderItem => ({
                phoneSlug: _objItem.phone_slug,
                phoneName: _objItem.phone_name,
                imageUrl: _objItem.image_url,
                unitPriceTwd: Number(_objItem.unit_price_twd),
                quantity: Number(_objItem.quantity),
            }),
        ),
    };
}

/**
 * 以會員目前的購物車建立訂單，並清空購物車
 * @param {string} _strUserId 會員 ID
 * @param {string} _strOrderNo 訂單編號
 * @param {CheckoutOrderData} _objData 已檢核的收件與付款資料
 * @returns {Promise<boolean>} 是否建立成功（購物車是空的時候為 false，且不會寫入任何資料）
 */
export async function createOrderFromCart(_strUserId: string, _strOrderNo: string, _objData: CheckoutOrderData): Promise<boolean> {
    const objSql = getSql();
    const strOrderId = crypto.randomUUID();

    // 三個敘述都以「訂單是否已建立」為條件，購物車為空時整筆交易不寫入任何資料
    const arrResults = await objSql.transaction(
        [
            objSql.query(
                `INSERT INTO TBL_ORDER (
                     ORDER_ID, ORDER_NO, USER_ID, RECIPIENT_NAME, RECIPIENT_PHONE, SHIPPING_ADDRESS,
                     PAYMENT_METHOD, CARD_BRAND, CARD_LAST4, TOTAL_TWD
                 )
                 SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, SUM(P.SALE_PRICE_TWD * CI.QUANTITY)
                 FROM TBL_CART_ITEM CI
                 JOIN TBL_PHONE P ON P.SLUG = CI.PHONE_SLUG
                 WHERE CI.USER_ID = $3
                 HAVING COUNT(*) > 0
                 RETURNING ORDER_NO`,
                [
                    strOrderId,
                    _strOrderNo,
                    _strUserId,
                    _objData.recipientName,
                    _objData.recipientPhone,
                    _objData.shippingAddress,
                    _objData.paymentMethod,
                    _objData.cardBrand,
                    _objData.cardLast4,
                ],
            ),
            objSql.query(
                `INSERT INTO TBL_ORDER_ITEM (ORDER_ID, PHONE_SLUG, PHONE_NAME, IMAGE_URL, UNIT_PRICE_TWD, QUANTITY)
                 SELECT $1, CI.PHONE_SLUG, P.NAME, P.IMAGE_URL, P.SALE_PRICE_TWD, CI.QUANTITY
                 FROM TBL_CART_ITEM CI
                 JOIN TBL_PHONE P ON P.SLUG = CI.PHONE_SLUG
                 WHERE CI.USER_ID = $2 AND EXISTS (SELECT 1 FROM TBL_ORDER WHERE ORDER_ID = $1)`,
                [strOrderId, _strUserId],
            ),
            objSql.query(
                `DELETE FROM TBL_CART_ITEM
                 WHERE USER_ID = $2 AND EXISTS (SELECT 1 FROM TBL_ORDER WHERE ORDER_ID = $1)`,
                [strOrderId, _strUserId],
            ),
        ],
        { isolationLevel: "RepeatableRead" },
    );

    return (arrResults[0] as unknown[]).length > 0;
}

/**
 * 依訂單編號取得會員自己的訂單
 * @param {string} _strUserId 會員 ID
 * @param {string} _strOrderNo 訂單編號
 * @returns {Promise<Order | null>} 訂單；不存在或不是此會員的訂單時為 null
 */
export async function getOrderByNo(_strUserId: string, _strOrderNo: string): Promise<Order | null> {
    const arrRows = await getSql().query(`${STR_ORDER_SELECT} WHERE O.USER_ID = $1 AND O.ORDER_NO = $2`, [
        _strUserId,
        _strOrderNo,
    ]);

    return arrRows.length > 0 ? convertOrderRow(arrRows[0] as OrderRow) : null;
}
