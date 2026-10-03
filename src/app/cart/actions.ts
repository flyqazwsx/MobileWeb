/*
MobileWeb Cart Actions
名稱：購物車 Server Actions
說明：瀏覽器端呼叫的購物車操作。每個動作都先在伺服器端確認登入（不信任用戶端傳來的會員資料），
      再檢核數量與手機代碼後寫入資料庫；回傳最新的購物車總件數，供頁首圖示更新

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／購物車]
*/

"use server";

import { refresh } from "next/cache";
import { auth } from "@/lib/auth/server";
import { isValidCartQuantity } from "@/lib/cart";
import { addCartItem, getCartCount, removeCartItem, setCartItemQuantity } from "@/lib/cart-repository";
import { getPhoneBySlug } from "@/lib/phone-repository";

/** 購物車動作失敗原因 */
export type CartFailReason = "unauthenticated" | "invalid-quantity" | "not-found";

/** 購物車動作結果 */
export type CartActionResult = { ok: true; count: number } | { ok: false; reason: CartFailReason };

/**
 * 取得目前登入會員的 ID
 * @returns {Promise<string | null>} 會員 ID；未登入時為 null
 */
async function getSignedInUserId(): Promise<string | null> {
    const { data: objSession } = await auth.getSession();
    return objSession?.user?.id ?? null;
}

/**
 * 取得目前登入會員的購物車總件數（頁首圖示用）
 * @returns {Promise<number>} 總件數；未登入時為 0
 */
export async function getCartCountAction(): Promise<number> {
    const strUserId = await getSignedInUserId();
    return strUserId ? getCartCount(strUserId) : 0;
}

/**
 * 加入購物車
 * @param {string} _strPhoneSlug 手機代碼
 * @param {number} _intQuantity 數量（1–99）
 * @returns {Promise<CartActionResult>} 結果與最新總件數
 */
export async function addToCartAction(_strPhoneSlug: string, _intQuantity: number): Promise<CartActionResult> {
    const strUserId = await getSignedInUserId();

    if (!strUserId) {
        return { ok: false, reason: "unauthenticated" };
    }

    if (!isValidCartQuantity(_intQuantity)) {
        return { ok: false, reason: "invalid-quantity" };
    }

    if (typeof _strPhoneSlug !== "string" || !(await getPhoneBySlug(_strPhoneSlug))) {
        return { ok: false, reason: "not-found" };
    }

    await addCartItem(strUserId, _strPhoneSlug, _intQuantity);
    return { ok: true, count: await getCartCount(strUserId) };
}

/**
 * 修改購物車中某支手機的數量
 * @param {string} _strPhoneSlug 手機代碼
 * @param {number} _intQuantity 新數量（1–99）
 * @returns {Promise<CartActionResult>} 結果與最新總件數
 */
export async function updateCartQuantityAction(_strPhoneSlug: string, _intQuantity: number): Promise<CartActionResult> {
    const strUserId = await getSignedInUserId();

    if (!strUserId) {
        return { ok: false, reason: "unauthenticated" };
    }

    if (!isValidCartQuantity(_intQuantity)) {
        return { ok: false, reason: "invalid-quantity" };
    }

    if (!(await setCartItemQuantity(strUserId, _strPhoneSlug, _intQuantity))) {
        return { ok: false, reason: "not-found" };
    }

    refresh();
    return { ok: true, count: await getCartCount(strUserId) };
}

/**
 * 從購物車移除某支手機
 * @param {string} _strPhoneSlug 手機代碼
 * @returns {Promise<CartActionResult>} 結果與最新總件數
 */
export async function removeFromCartAction(_strPhoneSlug: string): Promise<CartActionResult> {
    const strUserId = await getSignedInUserId();

    if (!strUserId) {
        return { ok: false, reason: "unauthenticated" };
    }

    await removeCartItem(strUserId, _strPhoneSlug);
    refresh();
    return { ok: true, count: await getCartCount(strUserId) };
}
