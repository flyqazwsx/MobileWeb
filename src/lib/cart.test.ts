import { describe, expect, it } from "vitest";
import { calculateCartTotals, clampCartQuantity, INT_MAX_CART_QUANTITY, isValidCartQuantity } from "@/lib/cart";
import type { CartItem } from "@/lib/types";

/**
 * 建立測試用購物車項目
 * @param {number} _intPrice 單價
 * @param {number} _intQuantity 數量
 * @returns {CartItem} 購物車項目
 */
function createItem(_intPrice: number, _intQuantity: number): CartItem {
    return {
        phoneSlug: `phone-${_intPrice}`,
        phoneName: "測試手機",
        imageUrl: null,
        brandColor: "#000000",
        unitPriceTwd: _intPrice,
        quantity: _intQuantity,
    };
}

describe("isValidCartQuantity（邊界值）", () => {
    it.each([1, 2, 98, 99])("%d 為合法數量", (_intQuantity) => {
        expect(isValidCartQuantity(_intQuantity)).toBe(true);
    });

    it.each([0, -1, 100, 1.5, Number.NaN, Number.POSITIVE_INFINITY, "2", null, undefined])("%s 不是合法數量", (_unkValue) => {
        expect(isValidCartQuantity(_unkValue)).toBe(false);
    });
});

describe("clampCartQuantity", () => {
    it("限制在 1–99，小數無條件捨去", () => {
        expect(clampCartQuantity(0)).toBe(1);
        expect(clampCartQuantity(-5)).toBe(1);
        expect(clampCartQuantity(150)).toBe(INT_MAX_CART_QUANTITY);
        expect(clampCartQuantity(3.9)).toBe(3);
        expect(clampCartQuantity(42)).toBe(42);
    });

    it("非數字（例如清空輸入框）回到 1", () => {
        expect(clampCartQuantity(Number.NaN)).toBe(1);
        expect(clampCartQuantity(Number(""))).toBe(1);
    });
});

describe("calculateCartTotals", () => {
    it("總件數為數量加總，總金額為單價 × 數量加總", () => {
        expect(calculateCartTotals([createItem(43490, 2), createItem(14990, 1)])).toEqual({
            intCount: 3,
            intTotalTwd: 43490 * 2 + 14990,
        });
    });

    it("空購物車為 0 件、0 元", () => {
        expect(calculateCartTotals([])).toEqual({ intCount: 0, intTotalTwd: 0 });
    });
});
