import { describe, expect, it } from "vitest";
import { arrPhoneData } from "@/data/phones";
import {
    INT_HOT_PHONE_LIMIT,
    getAllPhoneSlugs,
    getBrandBySlug,
    getBrands,
    getHotPhones,
    getPhoneBySlug,
    getPhonesByBrand,
} from "@/lib/phone-repository";

describe("getHotPhones", () => {
    it("預設回傳 20 筆，排名 1–20 依序排列", async () => {
        const arrHot = await getHotPhones();
        expect(arrHot).toHaveLength(INT_HOT_PHONE_LIMIT);
        expect(arrHot.map((_objPhone) => _objPhone.hotRank)).toEqual(
            Array.from({ length: INT_HOT_PHONE_LIMIT }, (_, _intIndex) => _intIndex + 1),
        );
    });

    it("可指定筆數", async () => {
        const arrHot = await getHotPhones(3);
        expect(arrHot.map((_objPhone) => _objPhone.hotRank)).toEqual([1, 2, 3]);
    });

    it("不包含未上榜的手機", async () => {
        const arrHot = await getHotPhones(999);
        expect(arrHot.every((_objPhone) => _objPhone.hotRank !== null)).toBe(true);
    });
});

describe("getPhonesByBrand", () => {
    it("只回傳該品牌，且依上市月份新到舊", async () => {
        const arrPhones = await getPhonesByBrand("apple");
        expect(arrPhones.length).toBeGreaterThan(0);
        expect(arrPhones.every((_objPhone) => _objPhone.brandSlug === "apple")).toBe(true);

        const arrMonths = arrPhones.map((_objPhone) => _objPhone.releaseMonth);
        expect(arrMonths).toEqual([...arrMonths].sort().reverse());
    });

    it("同月份依名稱排序", async () => {
        const arrPhones = await getPhonesByBrand("apple");
        const arrSameMonth = arrPhones.filter((_objPhone) => _objPhone.releaseMonth === "2025-09");
        const arrNames = arrSameMonth.map((_objPhone) => _objPhone.name);
        expect(arrNames).toEqual([...arrNames].sort((_strA, _strB) => _strA.localeCompare(_strB)));
    });

    it("未知品牌回傳空陣列", async () => {
        expect(await getPhonesByBrand("no-such-brand")).toEqual([]);
    });
});

describe("getBrandBySlug / getPhoneBySlug", () => {
    it("找得到時回傳物件", async () => {
        expect((await getBrandBySlug("samsung"))?.name).toBe("Samsung");
        expect((await getPhoneBySlug("iphone-17-pro"))?.name).toBe("iPhone 17 Pro");
    });

    it("找不到時回傳 null", async () => {
        expect(await getBrandBySlug("unknown")).toBeNull();
        expect(await getPhoneBySlug("unknown")).toBeNull();
    });
});

describe("getBrands / getAllPhoneSlugs", () => {
    it("回傳複本，修改不影響原始資料", async () => {
        const arrBrands = await getBrands();
        arrBrands.pop();
        expect((await getBrands()).length).toBe(arrBrands.length + 1);
    });

    it("手機代碼涵蓋所有資料", async () => {
        expect(await getAllPhoneSlugs()).toHaveLength(arrPhoneData.length);
    });
});
