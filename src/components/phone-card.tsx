/*
MobileWeb Phone Card
名稱：手機卡片元件
說明：首頁熱門排行與品牌頁共用的手機卡片，點擊進入詳細說明頁

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／基本原型]
*/

import Link from "next/link";
import PhoneImage from "@/components/phone-image";
import { formatCapacityList, formatPrice, getDiscountPercent } from "@/lib/format";
import type { Brand, Phone } from "@/lib/types";

interface PhoneCardProps {
    phone: Phone;
    brand: Brand | undefined;
    /** 是否顯示熱門排名徽章 */
    showRank?: boolean;
}

/**
 * 手機卡片
 * @param {PhoneCardProps} _objProps 元件屬性
 * @returns {JSX.Element} 卡片
 */
export default function PhoneCard(_objProps: PhoneCardProps) {
    const objPhone = _objProps.phone;
    const intDiscount = getDiscountPercent(objPhone.msrpTwd, objPhone.salePriceTwd);

    return (
        <Link
            href={`/phones/${objPhone.slug}`}
            data-testid="phone-card"
            className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            {_objProps.showRank && objPhone.hotRank !== null && (
                <span
                    data-testid="hot-rank"
                    className={`absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${
                        objPhone.hotRank <= 3 ? "bg-rose-500" : "bg-slate-700"
                    }`}
                >
                    {objPhone.hotRank}
                </span>
            )}
            {intDiscount > 0 && (
                <span className="absolute right-2 top-2 z-10 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    省 {intDiscount}%
                </span>
            )}

            <PhoneImage name={objPhone.name} imageUrl={objPhone.imageUrl} color={_objProps.brand?.color ?? "#64748b"} />

            <div className="mt-2 flex flex-1 flex-col">
                <p className="text-xs text-slate-500">{_objProps.brand?.name}</p>
                <h3 className="text-sm font-semibold leading-snug text-slate-900 group-hover:text-sky-700">
                    {objPhone.name}
                </h3>
                <p className="mt-1 text-xs text-slate-500">{formatCapacityList(objPhone.specs.storageGb)}</p>
                <div className="mt-auto pt-2">
                    <p className="text-xs text-slate-400 line-through">{formatPrice(objPhone.msrpTwd)}</p>
                    <p className="text-lg font-bold text-rose-600">{formatPrice(objPhone.salePriceTwd)}</p>
                </div>
            </div>
        </Link>
    );
}
