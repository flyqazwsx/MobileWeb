/*
MobileWeb Phone Repository
名稱：手機資料存取層
說明：頁面一律透過本檔取得資料，資料來源為 Neon（PostgreSQL）；
      函式以 React cache 包裝，同一次請求內重複呼叫（例如 generateMetadata 與頁面本體）只查詢一次

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／基本原型]
[2026-10-03] [flyqazwsx] [改接 Neon 資料庫，函式簽章維持不變]
*/

import { cache } from "react";
import { getSql } from "@/lib/db";
import { convertBrandRow, convertPhoneRow, type BrandRow, type PhoneRow } from "@/lib/phone-row";
import type { Brand, Phone } from "@/lib/types";

/** 首頁熱門排行顯示筆數 */
export const INT_HOT_PHONE_LIMIT = 20;

// [2026-10-03] [改接 Neon 資料庫] 手機查詢共用欄位：主表欄位 + 後鏡頭陣列 + 前鏡頭物件
const STR_PHONE_SELECT = `
    SELECT P.*,
        COALESCE((
            SELECT JSON_AGG(
                JSON_BUILD_OBJECT('role', C.LENS_ROLE, 'megapixels', C.MEGAPIXELS, 'detail', C.DETAIL)
                ORDER BY C.SORT_ORDER
            )
            FROM TBL_PHONE_CAMERA C
            WHERE C.PHONE_SLUG = P.SLUG AND C.IS_FRONT = FALSE
        ), '[]'::JSON) AS REAR_CAMERAS,
        (
            SELECT JSON_BUILD_OBJECT('role', C.LENS_ROLE, 'megapixels', C.MEGAPIXELS, 'detail', C.DETAIL)
            FROM TBL_PHONE_CAMERA C
            WHERE C.PHONE_SLUG = P.SLUG AND C.IS_FRONT = TRUE
            ORDER BY C.SORT_ORDER
            LIMIT 1
        ) AS FRONT_CAMERA
    FROM TBL_PHONE P`;

/**
 * 查詢手機並轉換型別
 * @param {string} _strCondition WHERE／ORDER BY／LIMIT 子句（值一律用 $1、$2 參數）
 * @param {unknown[]} _arrParams 查詢參數
 * @returns {Promise<Phone[]>} 手機清單
 */
async function queryPhones(_strCondition: string, _arrParams: unknown[] = []): Promise<Phone[]> {
    const arrRows = await getSql().query(`${STR_PHONE_SELECT} ${_strCondition}`, _arrParams);
    return (arrRows as PhoneRow[]).map(convertPhoneRow);
}

/**
 * 取得所有品牌（依選單顯示順序）
 * @returns {Promise<Brand[]>} 品牌清單
 */
export const getBrands = cache(async (): Promise<Brand[]> => {
    const arrRows = await getSql().query("SELECT SLUG, NAME, COLOR FROM TBL_BRAND ORDER BY SORT_ORDER");
    return (arrRows as BrandRow[]).map(convertBrandRow);
});

/**
 * 依代碼取得品牌
 * @param {string} _strBrandSlug 品牌代碼
 * @returns {Promise<Brand | null>} 品牌；找不到時為 null
 */
export const getBrandBySlug = cache(async (_strBrandSlug: string): Promise<Brand | null> => {
    const arrRows = await getSql().query("SELECT SLUG, NAME, COLOR FROM TBL_BRAND WHERE SLUG = $1", [_strBrandSlug]);
    return arrRows.length > 0 ? convertBrandRow(arrRows[0] as BrandRow) : null;
});

/**
 * 取得本月熱門手機（依排名由前到後）
 * @param {number} _intLimit 筆數上限，預設 20
 * @returns {Promise<Phone[]>} 熱門手機清單
 */
export const getHotPhones = cache(async (_intLimit: number = INT_HOT_PHONE_LIMIT): Promise<Phone[]> => {
    return queryPhones("WHERE P.HOT_RANK IS NOT NULL ORDER BY P.HOT_RANK LIMIT $1", [_intLimit]);
});

/**
 * 取得某品牌所有手機（新機在前，同月份依名稱排序）
 * @param {string} _strBrandSlug 品牌代碼
 * @returns {Promise<Phone[]>} 手機清單
 */
export const getPhonesByBrand = cache(async (_strBrandSlug: string): Promise<Phone[]> => {
    return queryPhones("WHERE P.BRAND_SLUG = $1 ORDER BY P.RELEASE_MONTH DESC, P.NAME", [_strBrandSlug]);
});

/**
 * 依代碼取得手機
 * @param {string} _strPhoneSlug 手機代碼
 * @returns {Promise<Phone | null>} 手機；找不到時為 null
 */
export const getPhoneBySlug = cache(async (_strPhoneSlug: string): Promise<Phone | null> => {
    const arrPhones = await queryPhones("WHERE P.SLUG = $1", [_strPhoneSlug]);
    return arrPhones[0] ?? null;
});

/**
 * 取得所有手機代碼（供靜態產生詳細頁）
 * @returns {Promise<string[]>} 手機代碼清單
 */
export const getAllPhoneSlugs = cache(async (): Promise<string[]> => {
    const arrRows = await getSql().query("SELECT SLUG FROM TBL_PHONE ORDER BY SLUG");
    return arrRows.map((_objRow) => _objRow.slug as string);
});
