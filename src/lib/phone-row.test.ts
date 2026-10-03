import { describe, expect, it } from "vitest";
import { convertBrandRow, convertPhoneRow, type PhoneRow } from "@/lib/phone-row";

/**
 * 建立測試用手機資料列（NUMERIC 欄位模擬資料庫傳回的字串）
 * @param {Partial<PhoneRow>} _objOverride 要覆寫的欄位
 * @returns {PhoneRow} 手機資料列
 */
function createPhoneRow(_objOverride: Partial<PhoneRow> = {}): PhoneRow {
    return {
        slug: "test-phone",
        brand_slug: "apple",
        name: "Test Phone",
        release_month: "2025-09",
        hot_rank: null,
        msrp_twd: 30000,
        sale_price_twd: 28000,
        image_url: null,
        height_mm: "150.10",
        width_mm: "71.50",
        depth_mm: "7.80",
        weight_g: "187.5",
        cpu: "Test SoC",
        ram_gb: [8, "12"],
        storage_gb: [128, 256],
        display_size_inch: "6.30",
        display_resolution: "2622 × 1206",
        display_panel: "OLED",
        display_refresh_hz: 120,
        video: "4K 60fps",
        battery_mah: 4500,
        os: "Android 16",
        rear_cameras: [
            { role: "主鏡頭", megapixels: "50.0", detail: "f/1.8" },
            { role: "超廣角", megapixels: 12, detail: "120°" },
        ],
        front_camera: { role: "前鏡頭", megapixels: "12.5", detail: "自動對焦" },
        ..._objOverride,
    };
}

describe("convertBrandRow", () => {
    it("只保留品牌欄位", () => {
        expect(convertBrandRow({ slug: "apple", name: "Apple", color: "#1d1d1f" })).toEqual({
            slug: "apple",
            name: "Apple",
            color: "#1d1d1f",
        });
    });
});

describe("convertPhoneRow", () => {
    it("NUMERIC 字串轉為數字，欄位對應到 Phone 型別", () => {
        const objPhone = convertPhoneRow(createPhoneRow({ hot_rank: 3, image_url: "https://example.com/a.png" }));

        expect(objPhone.brandSlug).toBe("apple");
        expect(objPhone.releaseMonth).toBe("2025-09");
        expect(objPhone.hotRank).toBe(3);
        expect(objPhone.imageUrl).toBe("https://example.com/a.png");
        expect(objPhone.specs.dimensions).toEqual({ heightMm: 150.1, widthMm: 71.5, depthMm: 7.8 });
        expect(objPhone.specs.weightG).toBe(187.5);
        expect(objPhone.specs.ramGb).toEqual([8, 12]);
        expect(objPhone.specs.display.sizeInch).toBe(6.3);
    });

    it("鏡頭保留順序並轉換畫素", () => {
        const objSpecs = convertPhoneRow(createPhoneRow()).specs;

        expect(objSpecs.rearCameras).toEqual([
            { role: "主鏡頭", megapixels: 50, detail: "f/1.8" },
            { role: "超廣角", megapixels: 12, detail: "120°" },
        ]);
        expect(objSpecs.frontCamera).toEqual({ role: "前鏡頭", megapixels: 12.5, detail: "自動對焦" });
    });

    it("缺少前鏡頭時丟出錯誤", () => {
        expect(() => convertPhoneRow(createPhoneRow({ front_camera: null }))).toThrow("test-phone 缺少前鏡頭資料");
    });
});
