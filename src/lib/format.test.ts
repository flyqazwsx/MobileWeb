import { describe, expect, it } from "vitest";
import {
    formatCapacityList,
    formatDateTime,
    formatDimensions,
    formatPrice,
    formatRankingMonth,
    formatReleaseMonth,
    getDiscountPercent,
} from "@/lib/format";

describe("formatPrice", () => {
    it("加上 NT$ 與千分位", () => {
        expect(formatPrice(43490)).toBe("NT$43,490");
    });

    it("小數四捨五入", () => {
        expect(formatPrice(999.6)).toBe("NT$1,000");
    });

    it("0 元", () => {
        expect(formatPrice(0)).toBe("NT$0");
    });
});

describe("getDiscountPercent", () => {
    it("一般折扣四捨五入取整數", () => {
        expect(getDiscountPercent(42900, 36990)).toBe(14);
    });

    it("售價等於建議售價時為 0", () => {
        expect(getDiscountPercent(29900, 29900)).toBe(0);
    });

    it("售價高於建議售價時為 0", () => {
        expect(getDiscountPercent(29900, 30900)).toBe(0);
    });

    it("建議售價為 0 或負數時為 0（避免除以零）", () => {
        expect(getDiscountPercent(0, 100)).toBe(0);
        expect(getDiscountPercent(-1, -5)).toBe(0);
    });
});

describe("formatDimensions", () => {
    it("高 × 寬 × 厚", () => {
        expect(formatDimensions({ heightMm: 163.4, widthMm: 78, depthMm: 8.75 })).toBe("163.4 × 78 × 8.75 mm");
    });
});

describe("formatCapacityList", () => {
    it("GB 與 TB 混合", () => {
        expect(formatCapacityList([256, 512, 1024, 2048])).toBe("256GB / 512GB / 1TB / 2TB");
    });

    it("單一容量", () => {
        expect(formatCapacityList([128])).toBe("128GB");
    });

    it("空陣列", () => {
        expect(formatCapacityList([])).toBe("");
    });
});

describe("formatReleaseMonth / formatRankingMonth", () => {
    it("去掉月份前導零", () => {
        expect(formatReleaseMonth("2025-09")).toBe("2025 年 9 月");
        expect(formatReleaseMonth("2024-12")).toBe("2024 年 12 月");
    });

    it("排行月份以傳入日期為準", () => {
        expect(formatRankingMonth(new Date(2026, 9, 3))).toBe("2026 年 10 月");
        expect(formatRankingMonth(new Date(2027, 0, 31))).toBe("2027 年 1 月");
    });
});

describe("formatDateTime", () => {
    it("以台灣時區顯示年月日時分（24 小時制）", () => {
        expect(formatDateTime("2026-10-04T06:05:00Z")).toBe("2026/10/04 14:05");
        expect(formatDateTime("2026-10-03T16:30:00Z")).toBe("2026/10/04 00:30");
    });
});
