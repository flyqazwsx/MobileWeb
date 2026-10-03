/*
MobileWeb Cart Page
名稱：購物車頁
說明：列出會員購物車內容、可修改數量與移除，並顯示總件數與總金額。
      依登入者讀取資料，因此每次請求動態產生；未登入由 src/proxy.ts 導向登入頁

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／購物車]
[2026-10-04] [flyqazwsx] [加入結帳按鈕]
*/

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import CartLine from "@/components/cart-line";
import { auth } from "@/lib/auth/server";
import { calculateCartTotals } from "@/lib/cart";
import { getCartItems } from "@/lib/cart-repository";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "購物車" };

/**
 * 購物車頁
 * @returns {Promise<JSX.Element>} 購物車內容
 */
export default async function CartPage() {
    const { data: objSession } = await auth.getSession();

    // proxy 已擋下未登入的請求；session 剛好失效時再保險導向一次
    if (!objSession?.user) {
        redirect("/auth/sign-in?redirectTo=%2Fcart");
    }

    const arrItems = await getCartItems(objSession.user.id);
    const objTotals = calculateCartTotals(arrItems);

    return (
        <div>
            <h1 className="mb-4 text-2xl font-bold text-slate-900">購物車</h1>

            {arrItems.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                    <p className="text-slate-600">購物車是空的。</p>
                    <Link href="/" className="mt-3 inline-block text-sky-700 underline">
                        去逛逛熱門手機
                    </Link>
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 bg-white px-4">
                    <ul className="divide-y divide-slate-100">
                        {arrItems.map((_objItem) => (
                            <CartLine key={_objItem.phoneSlug} item={_objItem} />
                        ))}
                    </ul>
                    <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-3 border-t border-slate-200 py-4">
                        <p className="text-sm text-slate-600">
                            共 <span data-testid="cart-total-count">{objTotals.intCount}</span> 件
                        </p>
                        <p className="text-lg font-bold text-rose-600">
                            總計 <span data-testid="cart-total-price">{formatPrice(objTotals.intTotalTwd)}</span>
                        </p>
                        {/* [2026-10-04] [結帳：前往結帳頁] */}
                        <Link href="/checkout" className="rounded-lg bg-rose-600 px-5 py-2.5 font-medium text-white hover:bg-rose-700">
                            結帳
                        </Link>
                    </div>
                </div>
            )}

            <p className="mt-3 text-xs text-slate-500">金額以目前本站售價計算。</p>
        </div>
    );
}
