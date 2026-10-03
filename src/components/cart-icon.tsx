/*
MobileWeb Cart Icon
名稱：頁首購物車圖示
說明：顯示購物車總件數，點擊進入購物車頁（未登入時由 proxy 導向登入頁）

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／購物車]
*/

"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";

/** 徽章最多顯示的數字，超過顯示 99+ */
const INT_BADGE_MAX = 99;

/**
 * 頁首購物車圖示
 * @returns {JSX.Element} 購物車連結與件數徽章
 */
export default function CartIcon() {
    const objCart = useCart();
    const strBadge = objCart.count > INT_BADGE_MAX ? `${INT_BADGE_MAX}+` : String(objCart.count);

    return (
        <Link
            href="/cart"
            aria-label={`購物車，共 ${objCart.count} 件`}
            data-testid="cart-icon"
            className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 hover:text-sky-700"
        >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden="true">
                <path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9.5" cy="20" r="1.3" />
                <circle cx="17.5" cy="20" r="1.3" />
            </svg>
            <span
                data-testid="cart-count"
                className={`absolute -right-1 -top-1 min-w-5 rounded-full px-1 text-center text-xs font-bold leading-5 ${
                    objCart.count > 0 ? "bg-rose-600 text-white" : "bg-slate-200 text-slate-600"
                }`}
            >
                {strBadge}
            </span>
        </Link>
    );
}
