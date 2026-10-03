/*
MobileWeb Phone Row Mapper
名稱：資料列轉換
說明：把 Neon 查詢結果（欄位名稱為小寫蛇形）轉成前端使用的 Brand／Phone 型別。
      PostgreSQL 的 NUMERIC 會以字串傳回，這裡統一轉為數字

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／改接 Neon 資料庫]
*/

import type { Brand, CameraLens, Phone } from "@/lib/types";

/** NUMERIC 欄位：資料庫傳回字串，也接受數字 */
type NumericValue = number | string;

/** TBL_BRAND 查詢結果 */
export interface BrandRow {
    slug: string;
    name: string;
    color: string;
}

/** 相機鏡頭（由 JSON_BUILD_OBJECT 組成） */
export interface CameraRow {
    role: string;
    megapixels: NumericValue;
    detail: string;
}

/** TBL_PHONE 查詢結果（含相機子查詢） */
export interface PhoneRow {
    slug: string;
    brand_slug: string;
    name: string;
    release_month: string;
    hot_rank: number | null;
    msrp_twd: number;
    sale_price_twd: number;
    image_url: string | null;
    height_mm: NumericValue;
    width_mm: NumericValue;
    depth_mm: NumericValue;
    weight_g: NumericValue;
    cpu: string;
    ram_gb: NumericValue[];
    storage_gb: NumericValue[];
    display_size_inch: NumericValue;
    display_resolution: string;
    display_panel: string;
    display_refresh_hz: number;
    video: string;
    battery_mah: number;
    os: string;
    rear_cameras: CameraRow[];
    front_camera: CameraRow | null;
}

/**
 * 轉換鏡頭資料
 * @param {CameraRow} _objRow 鏡頭資料列
 * @returns {CameraLens} 鏡頭規格
 */
function convertCameraRow(_objRow: CameraRow): CameraLens {
    return { role: _objRow.role, megapixels: Number(_objRow.megapixels), detail: _objRow.detail };
}

/**
 * 轉換品牌資料列
 * @param {BrandRow} _objRow 品牌資料列
 * @returns {Brand} 品牌
 */
export function convertBrandRow(_objRow: BrandRow): Brand {
    return { slug: _objRow.slug, name: _objRow.name, color: _objRow.color };
}

/**
 * 轉換手機資料列
 * @param {PhoneRow} _objRow 手機資料列
 * @returns {Phone} 手機
 * @throws {Error} 缺少前鏡頭資料時
 */
export function convertPhoneRow(_objRow: PhoneRow): Phone {
    if (!_objRow.front_camera) {
        throw new Error(`手機 ${_objRow.slug} 缺少前鏡頭資料`);
    }

    return {
        slug: _objRow.slug,
        brandSlug: _objRow.brand_slug,
        name: _objRow.name,
        releaseMonth: _objRow.release_month,
        hotRank: _objRow.hot_rank,
        msrpTwd: _objRow.msrp_twd,
        salePriceTwd: _objRow.sale_price_twd,
        imageUrl: _objRow.image_url,
        specs: {
            dimensions: {
                heightMm: Number(_objRow.height_mm),
                widthMm: Number(_objRow.width_mm),
                depthMm: Number(_objRow.depth_mm),
            },
            weightG: Number(_objRow.weight_g),
            cpu: _objRow.cpu,
            ramGb: _objRow.ram_gb.map(Number),
            storageGb: _objRow.storage_gb.map(Number),
            display: {
                sizeInch: Number(_objRow.display_size_inch),
                resolution: _objRow.display_resolution,
                panel: _objRow.display_panel,
                refreshHz: _objRow.display_refresh_hz,
            },
            rearCameras: _objRow.rear_cameras.map(convertCameraRow),
            frontCamera: convertCameraRow(_objRow.front_camera),
            video: _objRow.video,
            batteryMah: _objRow.battery_mah,
            os: _objRow.os,
        },
    };
}
