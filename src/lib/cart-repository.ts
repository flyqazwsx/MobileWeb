/*
MobileWeb Cart Repository
名稱：購物車資料存取層
說明：讀寫 TBL_CART_ITEM。呼叫端（Server Actions、購物車頁）負責確認登入並傳入會員 ID，
      本檔不處理登入狀態；數量一律在寫入前檢核，資料表另有 CHECK 約束做最後防線

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／購物車]
*/

import { INT_MAX_CART_QUANTITY, isValidCartQuantity } from "@/lib/cart";
import { getSql } from "@/lib/db";
import type { CartItem } from "@/lib/types";

/** 購物車查詢結果的資料列（PostgreSQL 欄位名稱為小寫） */
interface CartItemRow {
    phone_slug: string;
    phone_name: string;
    image_url: string | null;
    brand_color: string;
    unit_price_twd: number;
    quantity: number;
}

/**
 * 檢核數量，不合法時拋出錯誤
 * @param {unknown} _unkQuantity 數量
 * @returns {void}
 * @throws {RangeError} 數量不是 1–99 的整數時
 */
function assertQuantity(_unkQuantity: unknown): asserts _unkQuantity is number {
    if (!isValidCartQuantity(_unkQuantity)) {
        throw new RangeError(`購物車數量必須是 1–${INT_MAX_CART_QUANTITY} 的整數`);
    }
}

/**
 * 取得會員的購物車內容（依加入時間排序；已下架的手機不會出現）
 * @param {string} _strUserId 會員 ID
 * @returns {Promise<CartItem[]>} 購物車項目
 */
export async function getCartItems(_strUserId: string): Promise<CartItem[]> {
    const arrRows = await getSql().query(
        `SELECT CI.PHONE_SLUG, P.NAME AS PHONE_NAME, P.IMAGE_URL, B.COLOR AS BRAND_COLOR,
                P.SALE_PRICE_TWD AS UNIT_PRICE_TWD, CI.QUANTITY
         FROM TBL_CART_ITEM CI
         JOIN TBL_PHONE P ON P.SLUG = CI.PHONE_SLUG
         JOIN TBL_BRAND B ON B.SLUG = P.BRAND_SLUG
         WHERE CI.USER_ID = $1
         ORDER BY CI.CREATED_AT, CI.PHONE_SLUG`,
        [_strUserId],
    );

    return (arrRows as CartItemRow[]).map((_objRow) => ({
        phoneSlug: _objRow.phone_slug,
        phoneName: _objRow.phone_name,
        imageUrl: _objRow.image_url,
        brandColor: _objRow.brand_color,
        unitPriceTwd: Number(_objRow.unit_price_twd),
        quantity: Number(_objRow.quantity),
    }));
}

/**
 * 取得會員購物車的總件數（數量加總）
 * @param {string} _strUserId 會員 ID
 * @returns {Promise<number>} 總件數
 */
export async function getCartCount(_strUserId: string): Promise<number> {
    const arrRows = await getSql().query(
        "SELECT COALESCE(SUM(QUANTITY), 0) AS ITEM_COUNT FROM TBL_CART_ITEM WHERE USER_ID = $1",
        [_strUserId],
    );

    return Number((arrRows[0] as { item_count: number | string }).item_count);
}

/**
 * 加入購物車：已有同一支手機時累加數量，最多 99
 * @param {string} _strUserId 會員 ID
 * @param {string} _strPhoneSlug 手機代碼
 * @param {number} _intQuantity 要加入的數量（1–99）
 * @returns {Promise<number>} 加入後該手機的數量
 * @throws {RangeError} 數量不合法時
 */
export async function addCartItem(_strUserId: string, _strPhoneSlug: string, _intQuantity: number): Promise<number> {
    assertQuantity(_intQuantity);

    const arrRows = await getSql().query(
        `INSERT INTO TBL_CART_ITEM (USER_ID, PHONE_SLUG, QUANTITY)
         VALUES ($1, $2, $3)
         ON CONFLICT (USER_ID, PHONE_SLUG)
         DO UPDATE SET QUANTITY = LEAST(TBL_CART_ITEM.QUANTITY + EXCLUDED.QUANTITY, $4), UPDATED_AT = NOW()
         RETURNING QUANTITY`,
        [_strUserId, _strPhoneSlug, _intQuantity, INT_MAX_CART_QUANTITY],
    );

    return Number((arrRows[0] as { quantity: number }).quantity);
}

/**
 * 設定購物車中某支手機的數量
 * @param {string} _strUserId 會員 ID
 * @param {string} _strPhoneSlug 手機代碼
 * @param {number} _intQuantity 新數量（1–99）
 * @returns {Promise<boolean>} 是否有更新到資料（購物車沒有這支手機時為 false）
 * @throws {RangeError} 數量不合法時
 */
export async function setCartItemQuantity(_strUserId: string, _strPhoneSlug: string, _intQuantity: number): Promise<boolean> {
    assertQuantity(_intQuantity);

    const arrRows = await getSql().query(
        `UPDATE TBL_CART_ITEM SET QUANTITY = $3, UPDATED_AT = NOW()
         WHERE USER_ID = $1 AND PHONE_SLUG = $2
         RETURNING PHONE_SLUG`,
        [_strUserId, _strPhoneSlug, _intQuantity],
    );

    return arrRows.length > 0;
}

/**
 * 從購物車移除某支手機
 * @param {string} _strUserId 會員 ID
 * @param {string} _strPhoneSlug 手機代碼
 * @returns {Promise<boolean>} 是否有刪除到資料
 */
export async function removeCartItem(_strUserId: string, _strPhoneSlug: string): Promise<boolean> {
    const arrRows = await getSql().query(
        "DELETE FROM TBL_CART_ITEM WHERE USER_ID = $1 AND PHONE_SLUG = $2 RETURNING PHONE_SLUG",
        [_strUserId, _strPhoneSlug],
    );

    return arrRows.length > 0;
}
