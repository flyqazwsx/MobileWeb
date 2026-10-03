/*
MobileWeb Phone Repository
名稱：手機資料存取層
說明：頁面一律透過本檔取得資料。目前讀取 src/data 的示範資料；
      改接 Neon（Postgres）時只需替換本檔實作，函式簽章（皆為 async）維持不變

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／基本原型]
*/

import { arrBrandData } from "@/data/brands";
import { arrPhoneData } from "@/data/phones";
import type { Brand, Phone } from "@/lib/types";

/** 首頁熱門排行顯示筆數 */
export const INT_HOT_PHONE_LIMIT = 20;

/**
 * 取得所有品牌（依選單顯示順序）
 * @returns {Promise<Brand[]>} 品牌清單
 */
export async function getBrands(): Promise<Brand[]> {
    return [...arrBrandData];
}

/**
 * 依代碼取得品牌
 * @param {string} _strBrandSlug 品牌代碼
 * @returns {Promise<Brand | null>} 品牌；找不到時為 null
 */
export async function getBrandBySlug(_strBrandSlug: string): Promise<Brand | null> {
    return arrBrandData.find((_objBrand) => _objBrand.slug === _strBrandSlug) ?? null;
}

/**
 * 取得本月熱門手機（依排名由前到後）
 * @param {number} _intLimit 筆數上限，預設 20
 * @returns {Promise<Phone[]>} 熱門手機清單
 */
export async function getHotPhones(_intLimit: number = INT_HOT_PHONE_LIMIT): Promise<Phone[]> {
    return arrPhoneData
        .filter((_objPhone) => _objPhone.hotRank !== null)
        .sort((_objA, _objB) => (_objA.hotRank as number) - (_objB.hotRank as number))
        .slice(0, _intLimit);
}

/**
 * 取得某品牌所有手機（新機在前，同月份依名稱排序）
 * @param {string} _strBrandSlug 品牌代碼
 * @returns {Promise<Phone[]>} 手機清單
 */
export async function getPhonesByBrand(_strBrandSlug: string): Promise<Phone[]> {
    return arrPhoneData
        .filter((_objPhone) => _objPhone.brandSlug === _strBrandSlug)
        .sort((_objA, _objB) =>
            _objB.releaseMonth.localeCompare(_objA.releaseMonth) || _objA.name.localeCompare(_objB.name),
        );
}

/**
 * 依代碼取得手機
 * @param {string} _strPhoneSlug 手機代碼
 * @returns {Promise<Phone | null>} 手機；找不到時為 null
 */
export async function getPhoneBySlug(_strPhoneSlug: string): Promise<Phone | null> {
    return arrPhoneData.find((_objPhone) => _objPhone.slug === _strPhoneSlug) ?? null;
}

/**
 * 取得所有手機代碼（供靜態產生詳細頁）
 * @returns {Promise<string[]>} 手機代碼清單
 */
export async function getAllPhoneSlugs(): Promise<string[]> {
    return arrPhoneData.map((_objPhone) => _objPhone.slug);
}
