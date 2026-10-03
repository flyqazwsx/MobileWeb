/*
MobileWeb Checkout Page
名稱：結帳頁
說明：顯示訂單內容（購物車商品、總金額），填寫收件資訊並以信用卡付款。
      依登入者讀取資料，每次請求動態產生；未登入由 src/proxy.ts 導向登入頁

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／結帳]
*/

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import CheckoutForm from "@/components/checkout-form";
import { auth } from "@/lib/auth/server";
import { calculateCartTotals } from "@/lib/cart";
import { getCartItems } from "@/lib/cart-repository";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "結帳" };

/**
 * 結帳頁
 * @returns {Promise<JSX.Element>} 訂單內容與結帳表單
 */
export default async function CheckoutPage() {
    const { data: objSession } = await auth.getSession();

    if (!objSession?.user) {
        redirect("/auth/sign-in?redirectTo=%2Fcheckout");
    }

    const arrItems = await getCartItems(objSession.user.id);
    const objTotals = calculateCartTotals(arrItems);

    if (arrItems.length === 0) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                <h1 className="text-xl font-bold text-slate-900">結帳</h1>
                <p className="mt-2 text-slate-600">購物車是空的，沒有可以結帳的商品。</p>
                <Link href="/" className="mt-3 inline-block text-sky-700 underline">
                    去逛逛熱門手機
                </Link>
            </div>
        );
    }

    return (
        <div>
            <h1 className="mb-4 text-2xl font-bold text-slate-900">結帳</h1>

            <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
                <CheckoutForm totalTwd={objTotals.intTotalTwd} />

                <aside className="h-fit rounded-xl border border-slate-200 bg-white p-4 lg:order-last" data-testid="order-summary">
                    <h2 className="mb-3 text-lg font-bold text-slate-900">訂單資訊</h2>
                    <ul className="divide-y divide-slate-100 text-sm">
                        {arrItems.map((_objItem) => (
                            <li key={_objItem.phoneSlug} className="flex justify-between gap-3 py-2">
                                <span className="text-slate-700">
                                    {_objItem.phoneName} × {_objItem.quantity}
                                </span>
                                <span className="whitespace-nowrap font-medium text-slate-900">
                                    {formatPrice(_objItem.unitPriceTwd * _objItem.quantity)}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-sm text-slate-600">
                        <span>運費</span>
                        <span>免運</span>
                    </div>
                    <div className="mt-2 flex justify-between text-lg font-bold">
                        <span>共 {objTotals.intCount} 件</span>
                        <span className="text-rose-600" data-testid="checkout-total">
                            {formatPrice(objTotals.intTotalTwd)}
                        </span>
                    </div>
                    <Link href="/cart" className="mt-3 inline-block text-sm text-sky-700 underline">
                        返回購物車修改
                    </Link>
                </aside>
            </div>
        </div>
    );
}
