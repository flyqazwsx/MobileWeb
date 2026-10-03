/*
MobileWeb Phone Detail Page
名稱：手機詳細說明頁
說明：圖片、產品名稱、規格參數、相機詳細功能、官方建議售價、本站售價與網路評測連結

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／基本原型]
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PhoneImage from "@/components/phone-image";
import {
    formatCapacityList,
    formatDimensions,
    formatPrice,
    formatReleaseMonth,
    getDiscountPercent,
} from "@/lib/format";
import { getAllPhoneSlugs, getBrandBySlug, getPhoneBySlug } from "@/lib/phone-repository";
import { createReviewLinks } from "@/lib/review-links";

// 只產生已知手機，其餘網址回 404
export const dynamicParams = false;

/**
 * 預先產生所有手機詳細頁
 * @returns {Promise<{ slug: string }[]>} 路由參數清單
 */
export async function generateStaticParams() {
    const arrSlugs = await getAllPhoneSlugs();
    return arrSlugs.map((_strSlug) => ({ slug: _strSlug }));
}

/**
 * 產生頁面標題
 * @param {PageProps<"/phones/[slug]">} _objProps 頁面屬性
 * @returns {Promise<Metadata>} 頁面中繼資料
 */
export async function generateMetadata(_objProps: PageProps<"/phones/[slug]">): Promise<Metadata> {
    const { slug: strSlug } = await _objProps.params;
    const objPhone = await getPhoneBySlug(strSlug);
    return { title: objPhone ? `${objPhone.name} 規格與價格` : "找不到手機" };
}

/**
 * 手機詳細說明頁
 * @param {PageProps<"/phones/[slug]">} _objProps 頁面屬性
 * @returns {Promise<JSX.Element>} 頁面
 */
export default async function PhoneDetailPage(_objProps: PageProps<"/phones/[slug]">) {
    const { slug: strSlug } = await _objProps.params;
    const objPhone = await getPhoneBySlug(strSlug);

    if (!objPhone) {
        notFound();
    }

    const objBrand = await getBrandBySlug(objPhone.brandSlug);
    const objSpecs = objPhone.specs;
    const intDiscount = getDiscountPercent(objPhone.msrpTwd, objPhone.salePriceTwd);
    const arrReviewLinks = createReviewLinks(objPhone.name);

    // 規格表列：[項目, 內容]
    const arrSpecRows: [string, string][] = [
        ["尺寸", formatDimensions(objSpecs.dimensions)],
        ["重量", `${objSpecs.weightG} g`],
        ["處理器", objSpecs.cpu],
        ["記憶體", formatCapacityList(objSpecs.ramGb)],
        ["儲存容量", formatCapacityList(objSpecs.storageGb)],
        [
            "螢幕",
            `${objSpecs.display.sizeInch} 吋 ${objSpecs.display.panel}、${objSpecs.display.refreshHz}Hz`,
        ],
        ["解析度", objSpecs.display.resolution],
        ["電池", `${objSpecs.batteryMah.toLocaleString("en-US")} mAh`],
        ["作業系統", objSpecs.os],
        ["上市時間", formatReleaseMonth(objPhone.releaseMonth)],
    ];

    return (
        <article>
            <nav aria-label="麵包屑" className="mb-4 text-sm text-slate-500">
                <Link href="/" className="hover:text-sky-700">
                    首頁
                </Link>
                <span className="mx-1">/</span>
                {objBrand && (
                    <>
                        <Link href={`/brands/${objBrand.slug}`} className="hover:text-sky-700">
                            {objBrand.name}
                        </Link>
                        <span className="mx-1">/</span>
                    </>
                )}
                <span className="text-slate-700">{objPhone.name}</span>
            </nav>

            <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
                <div className="mx-auto w-full max-w-xs rounded-2xl bg-white p-4 shadow-sm">
                    <PhoneImage name={objPhone.name} imageUrl={objPhone.imageUrl} color={objBrand?.color ?? "#64748b"} />
                </div>

                <div>
                    <p className="text-sm text-slate-500">{objBrand?.name}</p>
                    <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{objPhone.name}</h1>
                    {objPhone.hotRank !== null && (
                        <p className="mt-2 inline-block rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-600">
                            🔥 本月熱門第 {objPhone.hotRank} 名
                        </p>
                    )}

                    <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 shadow-sm">
                        <div>
                            <dt className="text-xs text-slate-500">官方建議售價</dt>
                            <dd data-testid="msrp" className="text-lg text-slate-500 line-through">
                                {formatPrice(objPhone.msrpTwd)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-slate-500">本站售價</dt>
                            <dd data-testid="sale-price" className="text-2xl font-bold text-rose-600">
                                {formatPrice(objPhone.salePriceTwd)}
                                {intDiscount > 0 && (
                                    <span className="ml-2 align-middle text-sm font-medium text-amber-700">省 {intDiscount}%</span>
                                )}
                            </dd>
                        </div>
                        <p className="col-span-2 text-xs text-slate-400">
                            價格為 {formatCapacityList([objSpecs.storageGb[0]])} 版本
                        </p>
                    </dl>
                </div>
            </div>

            <section className="mt-8">
                <h2 className="text-xl font-bold text-slate-900">規格參數</h2>
                <table className="mt-3 w-full overflow-hidden rounded-2xl bg-white text-sm shadow-sm">
                    <tbody>
                        {arrSpecRows.map(([strLabel, strValue]) => (
                            <tr key={strLabel} className="border-b border-slate-100 last:border-0">
                                <th scope="row" className="w-28 bg-slate-50 px-4 py-2 text-left font-medium text-slate-600">
                                    {strLabel}
                                </th>
                                <td className="px-4 py-2 text-slate-900">{strValue}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="mt-8">
                <h2 className="text-xl font-bold text-slate-900">相機</h2>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                    {[...objSpecs.rearCameras, objSpecs.frontCamera].map((_objLens, _intIndex) => (
                        <li key={`${_objLens.role}-${_intIndex}`} className="rounded-2xl bg-white p-4 shadow-sm">
                            <p className="font-semibold text-slate-900">
                                {_objLens.role}・{_objLens.megapixels}MP
                            </p>
                            <p className="mt-1 text-sm text-slate-600">{_objLens.detail}</p>
                        </li>
                    ))}
                </ul>
                <p className="mt-3 text-sm text-slate-600">🎬 錄影：{objSpecs.video}</p>
            </section>

            <section className="mt-8">
                <h2 className="text-xl font-bold text-slate-900">網路評測</h2>
                <ul className="mt-3 flex flex-col gap-2 sm:flex-row">
                    {arrReviewLinks.map((_objLink) => (
                        <li key={_objLink.platform}>
                            <a
                                href={_objLink.url}
                                target="_blank"
                                rel="noreferrer"
                                data-testid="review-link"
                                className="inline-block rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:border-sky-500 hover:text-sky-700"
                            >
                                {_objLink.platform}｜{_objLink.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </section>
        </article>
    );
}
