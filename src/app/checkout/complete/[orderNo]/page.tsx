/*
MobileWeb Checkout Complete Page
名稱：訂單完成頁
說明：結帳成功後顯示訂單資訊（編號、品項、總金額、收件資訊、付款方式）。
      只能看自己的訂單；訂單不存在或不屬於目前會員時回 404

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／結帳]
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CartCountReset from "@/components/cart-count-reset";
import { auth } from "@/lib/auth/server";
import { formatDateTime, formatPrice } from "@/lib/format";
import { getOrderByNo } from "@/lib/order-repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "訂單完成" };

/**
 * 訂單完成頁
 * @param {PageProps<"/checkout/complete/[orderNo]">} _objProps 頁面屬性
 * @returns {Promise<JSX.Element>} 訂單資訊
 */
export default async function CheckoutCompletePage(_objProps: PageProps<"/checkout/complete/[orderNo]">) {
    const objParams = await _objProps.params;
    const { data: objSession } = await auth.getSession();

    if (!objSession?.user) {
        redirect("/auth/sign-in");
    }

    const objOrder = await getOrderByNo(objSession.user.id, objParams.orderNo);

    if (!objOrder) {
        notFound();
    }

    return (
        <div className="mx-auto max-w-2xl">
            <CartCountReset />

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <p className="text-3xl" aria-hidden="true">
                    ✅
                </p>
                <h1 className="mt-2 text-2xl font-bold text-emerald-800">訂單已成立，付款完成</h1>
                <p className="mt-1 text-sm text-emerald-700">
                    訂單編號 <span data-testid="order-no" className="font-mono font-bold">{objOrder.orderNo}</span>
                </p>
            </div>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4" data-testid="order-detail">
                <h2 className="mb-3 text-lg font-bold text-slate-900">訂單資訊</h2>
                <ul className="divide-y divide-slate-100 text-sm">
                    {objOrder.items.map((_objItem) => (
                        <li key={_objItem.phoneSlug} className="flex justify-between gap-3 py-2">
                            <span>
                                {_objItem.phoneName} × {_objItem.quantity}
                            </span>
                            <span className="whitespace-nowrap">{formatPrice(_objItem.unitPriceTwd * _objItem.quantity)}</span>
                        </li>
                    ))}
                </ul>
                <p className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg font-bold">
                    <span>總計</span>
                    <span className="text-rose-600" data-testid="order-total">
                        {formatPrice(objOrder.totalTwd)}
                    </span>
                </p>

                <dl className="mt-4 grid grid-cols-[6rem_1fr] gap-y-2 text-sm">
                    <dt className="text-slate-500">下單時間</dt>
                    <dd>{formatDateTime(objOrder.createdAt)}</dd>
                    <dt className="text-slate-500">收件人</dt>
                    <dd>
                        {objOrder.recipientName}（{objOrder.recipientPhone}）
                    </dd>
                    <dt className="text-slate-500">收件地址</dt>
                    <dd>{objOrder.shippingAddress}</dd>
                    <dt className="text-slate-500">付款方式</dt>
                    <dd data-testid="order-payment">
                        信用卡 {objOrder.cardBrand} **** {objOrder.cardLast4}
                    </dd>
                </dl>
            </section>

            <div className="mt-6 flex justify-center gap-4 text-sm">
                <Link href="/" className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">
                    繼續購物
                </Link>
            </div>
        </div>
    );
}
