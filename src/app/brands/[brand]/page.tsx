/*
MobileWeb Brand Page
名稱：品牌頁
說明：列出單一品牌的所有手機，點擊進入手機詳細說明頁

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／基本原型]
[2026-10-03] [flyqazwsx] [改接 Neon 資料庫，新增品牌免重新部署、每小時重新產生頁面]
*/

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PhoneCard from "@/components/phone-card";
import { getBrandBySlug, getBrands, getPhonesByBrand } from "@/lib/phone-repository";

// [2026-10-03] [改接 Neon 資料庫] 建置時先產生已知品牌；之後新增到資料庫的品牌於第一次造訪時產生，
// 資料庫查無此品牌時由頁面本體回 404
export const dynamicParams = true;

// [2026-10-03] [改接 Neon 資料庫] 資料庫更新後最慢一小時反映到頁面（ISR）
export const revalidate = 3600;

/**
 * 預先產生所有品牌頁
 * @returns {Promise<{ brand: string }[]>} 路由參數清單
 */
export async function generateStaticParams() {
    const arrBrands = await getBrands();
    return arrBrands.map((_objBrand) => ({ brand: _objBrand.slug }));
}

/**
 * 產生頁面標題
 * @param {PageProps<"/brands/[brand]">} _objProps 頁面屬性
 * @returns {Promise<Metadata>} 頁面中繼資料
 */
export async function generateMetadata(_objProps: PageProps<"/brands/[brand]">): Promise<Metadata> {
    const { brand: strBrandSlug } = await _objProps.params;
    const objBrand = await getBrandBySlug(strBrandSlug);
    return { title: objBrand ? `${objBrand.name} 手機` : "找不到品牌" };
}

/**
 * 品牌頁
 * @param {PageProps<"/brands/[brand]">} _objProps 頁面屬性
 * @returns {Promise<JSX.Element>} 頁面
 */
export default async function BrandPage(_objProps: PageProps<"/brands/[brand]">) {
    const { brand: strBrandSlug } = await _objProps.params;
    const objBrand = await getBrandBySlug(strBrandSlug);

    if (!objBrand) {
        notFound();
    }

    const arrPhones = await getPhonesByBrand(objBrand.slug);

    return (
        <section>
            <h1 className="text-2xl font-bold text-slate-900">{objBrand.name} 手機</h1>
            <p className="mt-1 text-sm text-slate-500">共 {arrPhones.length} 款，依上市時間由新到舊排列。</p>

            {arrPhones.length === 0 ? (
                <p className="mt-6 text-slate-500">目前尚無此品牌的手機資料。</p>
            ) : (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {arrPhones.map((_objPhone) => (
                        <PhoneCard key={_objPhone.slug} phone={_objPhone} brand={objBrand} />
                    ))}
                </div>
            )}
        </section>
    );
}
