/*
MobileWeb Cart Rules
名稱：購物車規則
說明：數量上下限、數量檢核與金額計算等純函式（不碰資料庫，方便單元測試）

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／購物車]
*/

import type { CartItem } from "@/lib/types";

/** 單一商品最少數量 */
export const INT_MIN_CART_QUANTITY = 1;

/** 單一商品最多數量（與資料表 CK_TBL_CART_ITEM_QUANTITY 一致） */
export const INT_MAX_CART_QUANTITY = 99;

/**
 * 檢核數量是否為允許範圍內的整數
 * @param {unknown} _unkQuantity 待檢核的值（來自表單或用戶端，型別不可信）
 * @returns {boolean} 是否為 1–99 的整數
 */
export function isValidCartQuantity(_unkQuantity: unknown): _unkQuantity is number {
    return (
        typeof _unkQuantity === "number" &&
        Number.isInteger(_unkQuantity) &&
        _unkQuantity >= INT_MIN_CART_QUANTITY &&
        _unkQuantity <= INT_MAX_CART_QUANTITY
    );
}

/**
 * 把數量限制在允許範圍內（數量選擇器輸入用）
 * @param {number} _intQuantity 數量
 * @returns {number} 1–99 的整數；非數字時回傳 1
 */
export function clampCartQuantity(_intQuantity: number): number {
    if (!Number.isFinite(_intQuantity)) {
        return INT_MIN_CART_QUANTITY;
    }

    return Math.min(INT_MAX_CART_QUANTITY, Math.max(INT_MIN_CART_QUANTITY, Math.trunc(_intQuantity)));
}

/**
 * 計算購物車總件數與總金額
 * @param {CartItem[]} _arrItems 購物車項目
 * @returns {{ intCount: number; intTotalTwd: number }} 總件數（數量加總）與總金額
 */
export function calculateCartTotals(_arrItems: CartItem[]): { intCount: number; intTotalTwd: number } {
    return _arrItems.reduce(
        (_objSum, _objItem) => ({
            intCount: _objSum.intCount + _objItem.quantity,
            intTotalTwd: _objSum.intTotalTwd + _objItem.unitPriceTwd * _objItem.quantity,
        }),
        { intCount: 0, intTotalTwd: 0 },
    );
}
