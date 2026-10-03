/*
MobileWeb Cart Count Reset
名稱：購物車件數同步
說明：結帳完成後購物車已在伺服器端清空，本元件掛載時重新取得件數，讓頁首圖示歸零

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／結帳]
*/

"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart-provider";

/**
 * 購物車件數同步（不顯示任何內容）
 * @returns {null} 無
 */
export default function CartCountReset() {
    const objCart = useCart();
    const fnRefreshCount = objCart.refreshCount;

    useEffect(() => {
        void fnRefreshCount();
    }, [fnRefreshCount]);

    return null;
}
