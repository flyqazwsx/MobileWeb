/*
MobileWeb Checkout Rules
名稱：結帳規則
說明：結帳表單的示範資料、欄位檢核與訂單編號產生（純函式，不碰資料庫）。
      本站尚未串接金流：信用卡只接受示範測試卡號，完整卡號、有效期限、安全碼皆不寫入資料庫，只保留卡別與末四碼

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／結帳]
*/

/** 結帳表單欄位（瀏覽器送出的原始值） */
export interface CheckoutFormInput {
    recipientName: string;
    recipientPhone: string;
    shippingAddress: string;
    paymentMethod: string;
    cardHolder: string;
    cardNumber: string;
    cardExpiry: string;
    cardCvc: string;
}

/** 檢核通過後要寫入訂單的資料（不含完整卡號） */
export interface CheckoutOrderData {
    recipientName: string;
    recipientPhone: string;
    shippingAddress: string;
    paymentMethod: "CREDIT_CARD";
    cardBrand: string;
    cardLast4: string;
}

/** 欄位錯誤訊息 */
export type CheckoutErrors = Partial<Record<keyof CheckoutFormInput, string>>;

/** 檢核結果 */
export type CheckoutValidation = { ok: true; data: CheckoutOrderData } | { ok: false; errors: CheckoutErrors };

/** 結帳表單預填的示範資料（虛構的收件資訊與公開測試卡號） */
export const objDummyCheckout: CheckoutFormInput = {
    recipientName: "王小明",
    recipientPhone: "0912-345-678",
    shippingAddress: "臺北市信義區示範路 100 號 5 樓",
    paymentMethod: "CREDIT_CARD",
    cardHolder: "WANG XIAO MING",
    cardNumber: "4242 4242 4242 4242",
    cardExpiry: "12/30",
    cardCvc: "123",
};

/** 接受的示範測試卡號（金流業者公開的測試卡號）→ 卡別 */
const objTestCardBrands: Record<string, string> = {
    "4242424242424242": "VISA",
    "5555555555554444": "MASTERCARD",
    "3566002020360505": "JCB",
};

/**
 * 只保留數字
 * @param {string} _strValue 原始字串
 * @returns {string} 數字字串
 */
function keepDigits(_strValue: string): string {
    return _strValue.replace(/\D/g, "");
}

/**
 * 檢查信用卡有效期限（MM/YY）是否為本月或之後
 * @param {string} _strExpiry 有效期限
 * @param {Date} _dtNow 現在時間
 * @returns {boolean} 是否有效
 */
export function isCardExpiryValid(_strExpiry: string, _dtNow: Date): boolean {
    const arrMatch = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(_strExpiry.trim());

    if (!arrMatch) {
        return false;
    }

    const intYear = 2000 + Number(arrMatch[2]);
    const intMonth = Number(arrMatch[1]);
    return intYear * 12 + intMonth >= _dtNow.getFullYear() * 12 + (_dtNow.getMonth() + 1);
}

/**
 * 檢核結帳表單
 * @param {CheckoutFormInput} _objInput 表單值
 * @param {Date} _dtNow 現在時間（檢查有效期限用）
 * @returns {CheckoutValidation} 通過時回傳要寫入訂單的資料，否則回傳各欄位錯誤
 */
export function validateCheckoutForm(_objInput: CheckoutFormInput, _dtNow: Date): CheckoutValidation {
    const objErrors: CheckoutErrors = {};
    const strName = _objInput.recipientName.trim();
    const strPhoneDigits = keepDigits(_objInput.recipientPhone);
    const strAddress = _objInput.shippingAddress.trim();
    const strCardDigits = keepDigits(_objInput.cardNumber);

    if (strName.length < 1 || strName.length > 50) {
        objErrors.recipientName = "請輸入收件人姓名（50 字以內）";
    }

    if (!/^09\d{8}$/.test(strPhoneDigits)) {
        objErrors.recipientPhone = "請輸入 09 開頭的 10 碼手機號碼";
    }

    if (strAddress.length < 5 || strAddress.length > 200) {
        objErrors.shippingAddress = "請輸入完整收件地址（5–200 字）";
    }

    if (_objInput.paymentMethod !== "CREDIT_CARD") {
        objErrors.paymentMethod = "目前只提供信用卡付款";
    }

    if (_objInput.cardHolder.trim().length < 1) {
        objErrors.cardHolder = "請輸入持卡人姓名";
    }

    if (!objTestCardBrands[strCardDigits]) {
        objErrors.cardNumber = "示範網站只接受測試卡號，請勿輸入真實信用卡";
    }

    if (!isCardExpiryValid(_objInput.cardExpiry, _dtNow)) {
        objErrors.cardExpiry = "請輸入有效期限（MM/YY），且不可早於本月";
    }

    if (!/^\d{3}$/.test(_objInput.cardCvc.trim())) {
        objErrors.cardCvc = "請輸入 3 碼安全碼";
    }

    if (Object.keys(objErrors).length > 0) {
        return { ok: false, errors: objErrors };
    }

    return {
        ok: true,
        data: {
            recipientName: strName,
            recipientPhone: `${strPhoneDigits.slice(0, 4)}-${strPhoneDigits.slice(4, 7)}-${strPhoneDigits.slice(7)}`,
            shippingAddress: strAddress,
            paymentMethod: "CREDIT_CARD",
            cardBrand: objTestCardBrands[strCardDigits],
            cardLast4: strCardDigits.slice(-4),
        },
    };
}

/**
 * 產生訂單編號：MW + 台灣日期（YYYYMMDD）+ 6 碼英數，例如 MW20261004-7K3QZP
 * @param {Date} _dtNow 下單時間
 * @param {() => number} _fnRandom 亂數來源（測試時可固定）
 * @returns {string} 訂單編號
 */
export function createOrderNo(_dtNow: Date, _fnRandom: () => number = Math.random): string {
    const STR_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const strDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" })
        .format(_dtNow)
        .replace(/-/g, "");
    const strSuffix = Array.from({ length: 6 }, () => STR_CHARSET[Math.floor(_fnRandom() * STR_CHARSET.length)]).join("");
    return `MW${strDate}-${strSuffix}`;
}
