/*
MobileWeb Order Actions
名稱：訂單 Server Actions
說明：取消訂單。先在伺服器端確認登入，取消條件（本人、已付款、未出貨）由資料庫更新條件把關

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／訂單管理]
*/

"use server";

import { refresh } from "next/cache";
import { auth } from "@/lib/auth/server";
import { cancelOrder } from "@/lib/order-repository";

/** 取消訂單結果 */
export type CancelOrderResult = { ok: true } | { ok: false; reason: "unauthenticated" | "not-cancellable" };

/**
 * 取消訂單
 * @param {string} _strOrderNo 訂單編號
 * @returns {Promise<CancelOrderResult>} 結果
 */
export async function cancelOrderAction(_strOrderNo: string): Promise<CancelOrderResult> {
    const { data: objSession } = await auth.getSession();

    if (!objSession?.user) {
        return { ok: false, reason: "unauthenticated" };
    }

    if (typeof _strOrderNo !== "string" || !(await cancelOrder(objSession.user.id, _strOrderNo))) {
        return { ok: false, reason: "not-cancellable" };
    }

    refresh();
    return { ok: true };
}
