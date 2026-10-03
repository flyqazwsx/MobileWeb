import { describe, expect, it } from "vitest";
import { arrBrandData } from "@/data/brands";
import { arrPhoneData } from "@/data/phones";

// 示範資料完整性檢查；之後改為資料匯入流程時，同樣的規則應套用在匯入結果
describe("示範資料完整性", () => {
    it("品牌與手機代碼不重複", () => {
        const arrBrandSlugs = arrBrandData.map((_objBrand) => _objBrand.slug);
        const arrPhoneSlugs = arrPhoneData.map((_objPhone) => _objPhone.slug);
        expect(new Set(arrBrandSlugs).size).toBe(arrBrandSlugs.length);
        expect(new Set(arrPhoneSlugs).size).toBe(arrPhoneSlugs.length);
    });

    it("代碼為小寫連字號格式（可直接當網址）", () => {
        const regSlug = /^[a-z0-9]+(-[a-z0-9]+)*$/;
        for (const objItem of [...arrBrandData, ...arrPhoneData]) {
            expect(objItem.slug).toMatch(regSlug);
        }
    });

    it("每支手機都對應到既有品牌，且每個品牌至少一支手機", () => {
        const setBrandSlugs = new Set(arrBrandData.map((_objBrand) => _objBrand.slug));
        for (const objPhone of arrPhoneData) {
            expect(setBrandSlugs.has(objPhone.brandSlug)).toBe(true);
        }
        for (const strBrandSlug of setBrandSlugs) {
            expect(arrPhoneData.some((_objPhone) => _objPhone.brandSlug === strBrandSlug)).toBe(true);
        }
    });

    it("熱門排名不重複，且至少有 20 支上榜", () => {
        const arrRanks = arrPhoneData.map((_objPhone) => _objPhone.hotRank).filter((_intRank) => _intRank !== null);
        expect(new Set(arrRanks).size).toBe(arrRanks.length);
        expect(arrRanks.length).toBeGreaterThanOrEqual(20);
    });

    it("價格與規格數值合理", () => {
        for (const objPhone of arrPhoneData) {
            expect(objPhone.msrpTwd).toBeGreaterThan(0);
            expect(objPhone.salePriceTwd).toBeGreaterThan(0);
            expect(objPhone.salePriceTwd).toBeLessThanOrEqual(objPhone.msrpTwd);
            expect(objPhone.releaseMonth).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
            expect(objPhone.specs.rearCameras.length).toBeGreaterThan(0);
            expect(objPhone.specs.storageGb.length).toBeGreaterThan(0);
            expect(objPhone.specs.ramGb.length).toBeGreaterThan(0);
        }
    });
});
