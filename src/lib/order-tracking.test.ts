import { describe, expect, it } from "vitest";
import {
    canCancelOrder,
    getOrderStatusLabel,
    getShipmentStage,
    getTrackingEvents,
    getTrackingNo,
    INT_CANCELLABLE_HOURS,
} from "@/lib/order-tracking";

const STR_CREATED_AT = "2026-10-04T00:00:00.000Z";

/**
 * 下單後經過指定小時數的時間
 * @param {number} _dblHours 小時數
 * @returns {Date} 時間
 */
function hoursLater(_dblHours: number): Date {
    return new Date(new Date(STR_CREATED_AT).getTime() + _dblHours * 3_600_000);
}

const objPaidOrder = { status: "PAID" as const, createdAt: STR_CREATED_AT };
const objCancelledOrder = { status: "CANCELLED" as const, createdAt: STR_CREATED_AT };

describe("getShipmentStage（各階段邊界）", () => {
    it.each([
        [0, "訂單成立"],
        [0.99, "訂單成立"],
        [1, "備貨中"],
        [23.99, "備貨中"],
        [24, "已出貨"],
        [36, "配送中"],
        [47.99, "配送中"],
        [48, "已送達"],
        [500, "已送達"],
    ])("下單後 %s 小時為「%s」", (_dblHours, _strLabel) => {
        expect(getShipmentStage(objPaidOrder, hoursLater(_dblHours))?.label).toBe(_strLabel);
    });

    it("時鐘誤差導致時間早於下單時，仍視為訂單成立", () => {
        expect(getShipmentStage(objPaidOrder, hoursLater(-1))?.code).toBe("CREATED");
    });

    it("已取消的訂單沒有物流階段", () => {
        expect(getShipmentStage(objCancelledOrder, hoursLater(30))).toBeNull();
    });
});

describe("getTrackingEvents", () => {
    it("列出五個階段與時間，已發生的標記為 done", () => {
        const arrEvents = getTrackingEvents(objPaidOrder, hoursLater(25));
        expect(arrEvents.map((_objEvent) => [_objEvent.label, _objEvent.done])).toEqual([
            ["訂單成立", true],
            ["備貨中", true],
            ["已出貨", true],
            ["配送中", false],
            ["已送達", false],
        ]);
        expect(arrEvents[2].time).toBe("2026-10-05T00:00:00.000Z");
    });

    it("已取消的訂單沒有物流資訊", () => {
        expect(getTrackingEvents(objCancelledOrder, hoursLater(1))).toEqual([]);
    });
});

describe("canCancelOrder（出貨前才可取消）", () => {
    it("已付款且未滿出貨時限可以取消", () => {
        expect(canCancelOrder(objPaidOrder, hoursLater(0))).toBe(true);
        expect(canCancelOrder(objPaidOrder, hoursLater(INT_CANCELLABLE_HOURS - 0.01))).toBe(true);
    });

    it("已出貨（滿時限）後不可取消", () => {
        expect(canCancelOrder(objPaidOrder, hoursLater(INT_CANCELLABLE_HOURS))).toBe(false);
    });

    it("已取消的訂單不可再取消", () => {
        expect(canCancelOrder(objCancelledOrder, hoursLater(0))).toBe(false);
    });
});

describe("getOrderStatusLabel", () => {
    it("狀態顯示文字", () => {
        expect(getOrderStatusLabel("PAID")).toBe("已付款");
        expect(getOrderStatusLabel("CANCELLED")).toBe("已取消");
    });
});

describe("getTrackingNo", () => {
    it("同一張訂單永遠得到同一個 12 碼物流單號，不同訂單不同", () => {
        const strNo = getTrackingNo("MW20261004-AAAAAA");
        expect(strNo).toMatch(/^9\d{11}$/);
        expect(getTrackingNo("MW20261004-AAAAAA")).toBe(strNo);
        expect(getTrackingNo("MW20261004-AAAAAB")).not.toBe(strNo);
    });
});
