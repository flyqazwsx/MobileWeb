/*
MobileWeb Cancel Order Button
名稱：取消訂單按鈕
說明：按下後先跳出確認，確認後呼叫取消訂單；成功時頁面由伺服器重新整理顯示「已取消」

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／訂單管理]
*/

"use client";

import { useState, useTransition } from "react";
import { cancelOrderAction } from "@/app/orders/actions";

interface CancelOrderButtonProps {
    orderNo: string;
}

/**
 * 取消訂單按鈕
 * @param {CancelOrderButtonProps} _objProps 元件屬性
 * @returns {JSX.Element} 按鈕與錯誤訊息
 */
export default function CancelOrderButton(_objProps: CancelOrderButtonProps) {
    const [strError, setStrError] = useState("");
    const [blnPending, startTransition] = useTransition();

    /**
     * 確認後取消訂單
     * @returns {void}
     */
    function onCancelClick(): void {
        if (!window.confirm(`確定要取消訂單 ${_objProps.orderNo} 嗎？取消後無法復原。`)) {
            return;
        }

        setStrError("");
        startTransition(async () => {
            const objResult = await cancelOrderAction(_objProps.orderNo);

            if (!objResult.ok) {
                setStrError(objResult.reason === "unauthenticated" ? "請重新登入" : "這張訂單已出貨或已取消，無法取消");
            }
        });
    }

    return (
        <span className="inline-flex flex-col items-start">
            <button
                type="button"
                onClick={onCancelClick}
                disabled={blnPending}
                className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-50"
            >
                {blnPending ? "取消中…" : "取消訂單"}
            </button>
            {strError && <span className="mt-1 text-xs text-rose-600">{strError}</span>}
        </span>
    );
}
