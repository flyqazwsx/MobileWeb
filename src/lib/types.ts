/*
MobileWeb Types
名稱：手機資料型別定義
說明：品牌、手機、規格、評測連結等共用型別；之後改接 Neon 資料庫時以此為資料契約

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／基本原型]
[2026-10-04] [flyqazwsx] [新增購物車項目型別]
[2026-10-04] [flyqazwsx] [新增訂單型別]
*/

/** 手機品牌 */
export interface Brand {
    /** 網址用代碼，例如 apple */
    slug: string;
    /** 顯示名稱 */
    name: string;
    /** 品牌代表色（預留圖片佔位用） */
    color: string;
}

/** 單一鏡頭規格 */
export interface CameraLens {
    /** 鏡頭用途，例如「主鏡頭」「超廣角」「望遠」 */
    role: string;
    /** 畫素（百萬） */
    megapixels: number;
    /** 光圈、焦段、防手震等細節 */
    detail: string;
}

/** 手機規格參數 */
export interface PhoneSpecs {
    /** 機身尺寸（公釐） */
    dimensions: { heightMm: number; widthMm: number; depthMm: number };
    /** 重量（公克） */
    weightG: number;
    /** 處理器 */
    cpu: string;
    /** 記憶體容量選項（GB） */
    ramGb: number[];
    /** 儲存容量選項（GB） */
    storageGb: number[];
    /** 螢幕 */
    display: { sizeInch: number; resolution: string; panel: string; refreshHz: number };
    /** 主相機（後鏡頭） */
    rearCameras: CameraLens[];
    /** 前鏡頭 */
    frontCamera: CameraLens;
    /** 錄影規格 */
    video: string;
    /** 電池容量（mAh） */
    batteryMah: number;
    /** 作業系統 */
    os: string;
}

/** 手機產品 */
export interface Phone {
    /** 網址用代碼，例如 iphone-17-pro */
    slug: string;
    /** 所屬品牌代碼 */
    brandSlug: string;
    /** 產品名稱 */
    name: string;
    /** 上市年月（YYYY-MM） */
    releaseMonth: string;
    /** 本月熱門排名，未上榜為 null */
    hotRank: number | null;
    /** 官方建議售價（新台幣，最低容量版本） */
    msrpTwd: number;
    /** 本站售價（新台幣，最低容量版本） */
    salePriceTwd: number;
    /** 圖片網址；尚無圖片時為 null，由前端顯示佔位圖 */
    imageUrl: string | null;
    /** 規格參數 */
    specs: PhoneSpecs;
}

/** 評測平台 */
export type ReviewPlatform = "YouTube" | "Facebook" | "Instagram";

/** 網路評測連結 */
export interface ReviewLink {
    platform: ReviewPlatform;
    label: string;
    url: string;
}

/** 購物車中的一項商品（依加入時間排序顯示） */
export interface CartItem {
    /** 手機代碼 */
    phoneSlug: string;
    /** 手機名稱 */
    phoneName: string;
    /** 圖片網址；無圖片時為 null */
    imageUrl: string | null;
    /** 品牌代表色（佔位圖用） */
    brandColor: string;
    /** 單價（本站售價，新台幣） */
    unitPriceTwd: number;
    /** 數量 */
    quantity: number;
}

/** 訂單狀態：已付款、已取消 */
export type OrderStatus = "PAID" | "CANCELLED";

/** 訂單明細（品名、單價為下單當下快照） */
export interface OrderItem {
    phoneSlug: string;
    phoneName: string;
    imageUrl: string | null;
    unitPriceTwd: number;
    quantity: number;
}

/** 訂單 */
export interface Order {
    orderNo: string;
    status: OrderStatus;
    recipientName: string;
    recipientPhone: string;
    shippingAddress: string;
    paymentMethod: "CREDIT_CARD";
    cardBrand: string;
    cardLast4: string;
    totalTwd: number;
    /** 下單時間（ISO 8601） */
    createdAt: string;
    /** 取消時間（ISO 8601）；未取消為 null */
    cancelledAt: string | null;
    items: OrderItem[];
}
