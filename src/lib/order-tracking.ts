/*
MobileWeb Order Tracking
名稱：訂單物流與取消規則
說明：示範用物流：尚未串接物流業者，進度依下單後經過時間推算（訂單成立 → 備貨中 → 已出貨 → 配送中 → 已送達）。
      「已出貨」之前可以取消訂單；資料庫的取消條件（order-repository）使用同一個時間門檻

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／訂單管理]
*/

import type { Order, OrderStatus } from "@/lib/types";

/** 物流階段代碼 */
export type ShipmentStageCode = "CREATED" | "PREPARING" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED";

/** 物流階段 */
export interface ShipmentStage {
    code: ShipmentStageCode;
    label: string;
    /** 下單後幾小時進入此階段 */
    hoursAfterOrder: number;
}

/** 物流階段定義（依時間先後） */
export const arrShipmentStages: ShipmentStage[] = [
    { code: "CREATED", label: "訂單成立", hoursAfterOrder: 0 },
    { code: "PREPARING", label: "備貨中", hoursAfterOrder: 1 },
    { code: "SHIPPED", label: "已出貨", hoursAfterOrder: 24 },
    { code: "IN_TRANSIT", label: "配送中", hoursAfterOrder: 36 },
    { code: "DELIVERED", label: "已送達", hoursAfterOrder: 48 },
];

/** 可取消的時限（小時）：出貨前 */
export const INT_CANCELLABLE_HOURS = 24;

/** 一小時的毫秒數 */
const INT_HOUR_MS = 60 * 60 * 1000;

/** 物流時間軸的一個節點 */
export interface TrackingEvent {
    code: ShipmentStageCode;
    label: string;
    /** 預計或實際時間（ISO 8601） */
    time: string;
    /** 是否已發生 */
    done: boolean;
}

/**
 * 訂單狀態顯示文字
 * @param {OrderStatus} _strStatus 訂單狀態
 * @returns {string} 顯示文字
 */
export function getOrderStatusLabel(_strStatus: OrderStatus): string {
    return _strStatus === "CANCELLED" ? "已取消" : "已付款";
}

/**
 * 計算下單後經過的小時數
 * @param {string} _strCreatedAt 下單時間（ISO 8601）
 * @param {Date} _dtNow 現在時間
 * @returns {number} 經過小時數（可為小數）
 */
function getHoursSinceOrder(_strCreatedAt: string, _dtNow: Date): number {
    return (_dtNow.getTime() - new Date(_strCreatedAt).getTime()) / INT_HOUR_MS;
}

/**
 * 取得目前的物流階段
 * @param {Order} _objOrder 訂單
 * @param {Date} _dtNow 現在時間
 * @returns {ShipmentStage | null} 物流階段；已取消的訂單沒有物流，回傳 null
 */
export function getShipmentStage(_objOrder: Pick<Order, "status" | "createdAt">, _dtNow: Date): ShipmentStage | null {
    if (_objOrder.status === "CANCELLED") {
        return null;
    }

    const dblHours = getHoursSinceOrder(_objOrder.createdAt, _dtNow);
    return arrShipmentStages.filter((_objStage) => dblHours >= _objStage.hoursAfterOrder).at(-1) ?? arrShipmentStages[0];
}

/**
 * 產生物流時間軸
 * @param {Order} _objOrder 訂單
 * @param {Date} _dtNow 現在時間
 * @returns {TrackingEvent[]} 各階段與時間；已取消的訂單回傳空陣列
 */
export function getTrackingEvents(_objOrder: Pick<Order, "status" | "createdAt">, _dtNow: Date): TrackingEvent[] {
    if (_objOrder.status === "CANCELLED") {
        return [];
    }

    const intCreatedMs = new Date(_objOrder.createdAt).getTime();
    return arrShipmentStages.map((_objStage) => {
        const intStageMs = intCreatedMs + _objStage.hoursAfterOrder * INT_HOUR_MS;
        return {
            code: _objStage.code,
            label: _objStage.label,
            time: new Date(intStageMs).toISOString(),
            done: _dtNow.getTime() >= intStageMs,
        };
    });
}

/**
 * 是否可以取消訂單：已付款且尚未出貨
 * @param {Order} _objOrder 訂單
 * @param {Date} _dtNow 現在時間
 * @returns {boolean} 是否可取消
 */
export function canCancelOrder(_objOrder: Pick<Order, "status" | "createdAt">, _dtNow: Date): boolean {
    return _objOrder.status === "PAID" && getHoursSinceOrder(_objOrder.createdAt, _dtNow) < INT_CANCELLABLE_HOURS;
}

/**
 * 產生示範物流單號（由訂單編號固定推得，同一張訂單永遠相同）
 * @param {string} _strOrderNo 訂單編號
 * @returns {string} 12 碼數字的物流單號
 */
export function getTrackingNo(_strOrderNo: string): string {
    let intHash = 7;
    for (const strChar of _strOrderNo) {
        intHash = (intHash * 31 + strChar.charCodeAt(0)) % 1_000_000_007;
    }
    return `9${String(intHash).padStart(11, "0")}`;
}
