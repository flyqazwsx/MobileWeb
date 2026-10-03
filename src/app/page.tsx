/*
MobileWeb Home Page
名稱：首頁
說明：列出本月最熱門的手機前 20 名，點擊進入手機詳細說明頁

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／基本原型]
[2026-10-03] [flyqazwsx] [改接 Neon 資料庫，每小時重新產生頁面]
*/

import PhoneCard from "@/components/phone-card";
import { formatRankingMonth } from "@/lib/format";
import { INT_HOT_PHONE_LIMIT, getBrands, getHotPhones } from "@/lib/phone-repository";

// [2026-10-03] [改接 Neon 資料庫] 資料庫更新後最慢一小時反映到頁面（ISR）
export const revalidate = 3600;

/**
 * 首頁：本月熱門手機排行
 * @returns {Promise<JSX.Element>} 頁面
 */
export default async function HomePage() {
    const [arrHotPhones, arrBrands] = await Promise.all([getHotPhones(INT_HOT_PHONE_LIMIT), getBrands()]);

    return (
        <section>
            <h1 className="text-2xl font-bold text-slate-900">
                {formatRankingMonth(new Date())}熱門手機 TOP {INT_HOT_PHONE_LIMIT}
            </h1>
            <p className="mt-1 text-sm text-slate-500">依本月瀏覽與詢問熱度排名，點擊查看完整規格與價格。</p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {arrHotPhones.map((_objPhone) => (
                    <PhoneCard
                        key={_objPhone.slug}
                        phone={_objPhone}
                        brand={arrBrands.find((_objBrand) => _objBrand.slug === _objPhone.brandSlug)}
                        showRank
                    />
                ))}
            </div>
        </section>
    );
}
