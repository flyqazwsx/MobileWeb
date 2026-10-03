/*
MobileWeb Order Tracking Page
名稱：物流查詢頁
說明：顯示單張訂單的物流單號與配送進度時間軸（示範資料，依下單時間推算）；已取消的訂單顯示無物流資訊。
      只能查自己的訂單，不存在或不屬於目前會員時回 404

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／訂單管理]
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { formatDateTime } from "@/lib/format";
import { getOrderByNo } from "@/lib/order-repository";
import { getTrackingEvents, getTrackingNo } from "@/lib/order-tracking";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "物流查詢" };

/**
 * 物流查詢頁
 * @param {PageProps<"/orders/[orderNo]/tracking">} _objProps 頁面屬性
 * @returns {Promise<JSX.Element>} 物流時間軸
 */
export default async function OrderTrackingPage(_objProps: PageProps<"/orders/[orderNo]/tracking">) {
    const objParams = await _objProps.params;
    const { data: objSession } = await auth.getSession();

    if (!objSession?.user) {
        redirect("/auth/sign-in?redirectTo=%2Forders");
    }

    const objOrder = await getOrderByNo(objSession.user.id, objParams.orderNo);

    if (!objOrder) {
        notFound();
    }

    const arrEvents = getTrackingEvents(objOrder, new Date());

    return (
        <div className="mx-auto max-w-xl">
            <Link href="/orders" className="text-sm text-sky-700 underline">
                ← 返回訂單管理
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">物流查詢</h1>
            <p className="mt-1 text-sm text-slate-600">
                訂單編號 <span className="font-mono">{objOrder.orderNo}</span>
            </p>

            {arrEvents.length === 0 ? (
                <p className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-slate-600" data-testid="tracking-empty">
                    此訂單已取消，沒有物流資訊。
                </p>
            ) : (
                <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
                    <p className="text-sm text-slate-600">
                        配送業者：示範宅配・物流單號 <span className="font-mono" data-testid="tracking-no">{getTrackingNo(objOrder.orderNo)}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">示範資料：尚未串接物流業者，進度依下單時間推算。</p>

                    <ol className="mt-5 space-y-4 border-l-2 border-slate-200 pl-5">
                        {arrEvents.map((_objEvent) => (
                            <li key={_objEvent.code} data-testid="tracking-event" data-done={_objEvent.done} className="relative">
                                <span
                                    aria-hidden="true"
                                    className={`absolute -left-[1.85rem] top-1 h-3.5 w-3.5 rounded-full border-2 ${
                                        _objEvent.done ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-white"
                                    }`}
                                />
                                <p className={`font-medium ${_objEvent.done ? "text-slate-900" : "text-slate-400"}`}>{_objEvent.label}</p>
                                <p className="text-xs text-slate-500">
                                    {_objEvent.done ? "" : "預計 "}
                                    {formatDateTime(_objEvent.time)}
                                </p>
                            </li>
                        ))}
                    </ol>
                </section>
            )}
        </div>
    );
}
