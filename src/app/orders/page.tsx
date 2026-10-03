/*
MobileWeb Orders Page
名稱：訂單管理
說明：列出會員所有訂單（新到舊）：訂單資訊、狀態與物流進度；未出貨的訂單可取消，每張訂單可查看物流。
      依登入者讀取資料，每次請求動態產生；未登入由 src/proxy.ts 導向登入頁

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／訂單管理]
*/

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import CancelOrderButton from "@/components/cancel-order-button";
import { auth } from "@/lib/auth/server";
import { formatDateTime, formatPrice } from "@/lib/format";
import { getOrders } from "@/lib/order-repository";
import { canCancelOrder, getOrderStatusLabel, getShipmentStage } from "@/lib/order-tracking";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "訂單管理" };

/**
 * 訂單管理頁
 * @returns {Promise<JSX.Element>} 訂單列表
 */
export default async function OrdersPage() {
    const { data: objSession } = await auth.getSession();

    if (!objSession?.user) {
        redirect("/auth/sign-in?redirectTo=%2Forders");
    }

    const arrOrders = await getOrders(objSession.user.id);
    const dtNow = new Date();

    return (
        <div>
            <h1 className="mb-4 text-2xl font-bold text-slate-900">訂單管理</h1>

            {arrOrders.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                    <p className="text-slate-600">目前沒有訂單。</p>
                    <Link href="/" className="mt-3 inline-block text-sky-700 underline">
                        去逛逛熱門手機
                    </Link>
                </div>
            ) : (
                <ul className="space-y-4">
                    {arrOrders.map((_objOrder) => {
                        const objStage = getShipmentStage(_objOrder, dtNow);
                        const blnCancelled = _objOrder.status === "CANCELLED";

                        return (
                            <li
                                key={_objOrder.orderNo}
                                data-testid="order-card"
                                className="rounded-xl border border-slate-200 bg-white p-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                    <div>
                                        <p className="font-mono font-bold text-slate-900" data-testid="order-card-no">
                                            {_objOrder.orderNo}
                                        </p>
                                        <p className="text-xs text-slate-500">下單時間 {formatDateTime(_objOrder.createdAt)}</p>
                                    </div>
                                    <span
                                        data-testid="order-status"
                                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                                            blnCancelled ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"
                                        }`}
                                    >
                                        {getOrderStatusLabel(_objOrder.status)}
                                        {objStage && `・${objStage.label}`}
                                    </span>
                                </div>

                                <ul className="divide-y divide-slate-50 py-2 text-sm">
                                    {_objOrder.items.map((_objItem) => (
                                        <li key={_objItem.phoneSlug} className="flex justify-between gap-3 py-1.5">
                                            <span className="text-slate-700">
                                                {_objItem.phoneName} × {_objItem.quantity}
                                            </span>
                                            <span className="whitespace-nowrap">{formatPrice(_objItem.unitPriceTwd * _objItem.quantity)}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                                    <div className="text-sm text-slate-600">
                                        <p>
                                            收件：{_objOrder.recipientName}・{_objOrder.shippingAddress}
                                        </p>
                                        <p>
                                            付款：信用卡 {_objOrder.cardBrand} **** {_objOrder.cardLast4}
                                        </p>
                                        {blnCancelled && _objOrder.cancelledAt && (
                                            <p className="text-slate-500">取消時間 {formatDateTime(_objOrder.cancelledAt)}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-lg font-bold text-rose-600">{formatPrice(_objOrder.totalTwd)}</p>
                                        {canCancelOrder(_objOrder, dtNow) && <CancelOrderButton orderNo={_objOrder.orderNo} />}
                                        <Link
                                            href={`/orders/${_objOrder.orderNo}/tracking`}
                                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
                                        >
                                            查看物流
                                        </Link>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
