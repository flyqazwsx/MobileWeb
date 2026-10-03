import { describe, expect, it } from "vitest";
import { arrBrandData } from "@/data/brands";
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

// 整合測試：直接查詢 Neon。前提是已執行 npm run db:migrate 與 npm run db:seed（資料庫內容 = 示範資料）
// 未設定 DATABASE_URL 時整組略過
const blnHasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!blnHasDatabase)("phone-repository（Neon）", () => {
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
        it("品牌依選單順序回傳", async () => {
            expect(await getBrands()).toEqual(arrBrandData);
        });

        it("手機代碼涵蓋所有資料", async () => {
            expect([...(await getAllPhoneSlugs())].sort()).toEqual(arrPhoneData.map((_objPhone) => _objPhone.slug).sort());
        });
    });

    describe("資料往返一致", () => {
        it("每支手機從資料庫讀回後與示範資料完全相同（含數值型別、容量陣列、鏡頭順序）", async () => {
            for (const objExpected of arrPhoneData) {
                expect(await getPhoneBySlug(objExpected.slug)).toStrictEqual(objExpected);
            }
        });
    });
});
