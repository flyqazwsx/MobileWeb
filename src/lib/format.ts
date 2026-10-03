/*
MobileWeb Format Helpers
名稱：顯示格式化工具
說明：價格、折扣、尺寸、容量、上市月份等顯示用格式化函式

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／基本原型]
[2026-10-04] [flyqazwsx] [新增日期時間格式化（訂單用）]
*/

import type { PhoneSpecs } from "@/lib/types";

/**
 * 格式化新台幣價格，例如 43490 → "NT$43,490"
 * @param {number} _intPriceTwd 價格（新台幣）
 * @returns {string} 顯示文字
 */
export function formatPrice(_intPriceTwd: number): string {
    return `NT$${Math.round(_intPriceTwd).toLocaleString("en-US")}`;
}

/**
 * 計算本站售價相對官方建議售價的折扣百分比（四捨五入取整數）
 * @param {number} _intMsrpTwd 官方建議售價
 * @param {number} _intSalePriceTwd 本站售價
 * @returns {number} 折扣百分比；沒有折扣或資料異常時為 0
 */
export function getDiscountPercent(_intMsrpTwd: number, _intSalePriceTwd: number): number {
    if (_intMsrpTwd <= 0 || _intSalePriceTwd >= _intMsrpTwd) {
        return 0;
    }

    return Math.round(((_intMsrpTwd - _intSalePriceTwd) / _intMsrpTwd) * 100);
}

/**
 * 格式化機身尺寸，例如 "163.4 × 78 × 8.75 mm"
 * @param {PhoneSpecs["dimensions"]} _objDimensions 尺寸
 * @returns {string} 顯示文字
 */
export function formatDimensions(_objDimensions: PhoneSpecs["dimensions"]): string {
    return `${_objDimensions.heightMm} × ${_objDimensions.widthMm} × ${_objDimensions.depthMm} mm`;
}

/**
 * 格式化容量清單，1024GB 以上改以 TB 顯示，例如 [256, 1024] → "256GB / 1TB"
 * @param {number[]} _arrCapacityGb 容量（GB）
 * @returns {string} 顯示文字
 */
export function formatCapacityList(_arrCapacityGb: number[]): string {
    return _arrCapacityGb
        .map((_intGb) => (_intGb >= 1024 ? `${_intGb / 1024}TB` : `${_intGb}GB`))
        .join(" / ");
}

/**
 * 格式化上市年月，例如 "2025-09" → "2025 年 9 月"
 * @param {string} _strReleaseMonth 年月（YYYY-MM）
 * @returns {string} 顯示文字
 */
export function formatReleaseMonth(_strReleaseMonth: string): string {
    const [strYear, strMonth] = _strReleaseMonth.split("-");
    return `${strYear} 年 ${Number(strMonth)} 月`;
}

/**
 * 取得熱門排行標題用的年月文字，例如 2026-10-03 → "2026 年 10 月"
 * @param {Date} _dtNow 目前時間
 * @returns {string} 顯示文字
 */
export function formatRankingMonth(_dtNow: Date): string {
    return `${_dtNow.getFullYear()} 年 ${_dtNow.getMonth() + 1} 月`;
}

/**
 * 格式化日期時間（台灣時區），例如 "2026/10/04 14:05"
 * @param {string} _strIso ISO 8601 時間字串
 * @returns {string} 顯示文字
 */
export function formatDateTime(_strIso: string): string {
    // 用 formatToParts 自行組字串：各版本 ICU 在日期與時間之間的空白字元不同（例如 U+2009）
    const arrParts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Taipei",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(new Date(_strIso));
    const objParts = Object.fromEntries(arrParts.map((_objPart) => [_objPart.type, _objPart.value]));

    return `${objParts.year}/${objParts.month}/${objParts.day} ${objParts.hour}:${objParts.minute}`;
}
