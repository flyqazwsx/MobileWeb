/*
MobileWeb Checkout Actions
名稱：結帳 Server Action
說明：送出結帳表單：確認登入 → 檢核欄位（只接受測試卡號）→ 由購物車建立訂單 → 導向訂單完成頁。
      完整卡號、有效期限、安全碼只在本函式內檢核，不寫入資料庫也不寫入紀錄

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／結帳]
*/

"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { createOrderNo, validateCheckoutForm, type CheckoutErrors, type CheckoutFormInput } from "@/lib/checkout";
import { createOrderFromCart } from "@/lib/order-repository";

/** 結帳表單送出後的狀態（給 useActionState） */
export interface CheckoutState {
    /** 整體錯誤訊息 */
    message: string;
    /** 各欄位錯誤 */
    errors: CheckoutErrors;
    /** 送出的欄位值（React 19 送出後會重設表單，用來保留使用者輸入）；卡號與安全碼不回傳 */
    values?: Partial<CheckoutFormInput>;
}

/** 表單欄位名稱 */
const arrFieldNames: Array<keyof CheckoutFormInput> = [
    "recipientName",
    "recipientPhone",
    "shippingAddress",
    "paymentMethod",
    "cardHolder",
    "cardNumber",
    "cardExpiry",
    "cardCvc",
];

/** 不回傳給瀏覽器的敏感欄位 */
const arrSecretFieldNames: Array<keyof CheckoutFormInput> = ["cardNumber", "cardCvc"];

/**
 * 從 FormData 取出結帳欄位（缺少的欄位視為空字串）
 * @param {FormData} _objFormData 表單資料
 * @returns {CheckoutFormInput} 欄位值
 */
function readCheckoutForm(_objFormData: FormData): CheckoutFormInput {
    return Object.fromEntries(
        arrFieldNames.map((_strName) => {
            const unkValue = _objFormData.get(_strName);
            return [_strName, typeof unkValue === "string" ? unkValue : ""];
        }),
    ) as unknown as CheckoutFormInput;
}

/**
 * 送出結帳
 * @param {CheckoutState} _objPrevState 上一次的狀態（useActionState 傳入，未使用）
 * @param {FormData} _objFormData 表單資料
 * @returns {Promise<CheckoutState>} 失敗時的錯誤；成功時導向訂單完成頁，不會回傳
 */
export async function placeOrderAction(_objPrevState: CheckoutState, _objFormData: FormData): Promise<CheckoutState> {
    const { data: objSession } = await auth.getSession();

    if (!objSession?.user) {
        redirect("/auth/sign-in?redirectTo=%2Fcheckout");
    }

    const dtNow = new Date();
    const objInput = readCheckoutForm(_objFormData);
    const objValidation = validateCheckoutForm(objInput, dtNow);

    if (!objValidation.ok) {
        const objSafeValues = Object.fromEntries(
            arrFieldNames.filter((_strName) => !arrSecretFieldNames.includes(_strName)).map((_strName) => [_strName, objInput[_strName]]),
        );
        return { message: "請修正標示的欄位", errors: objValidation.errors, values: objSafeValues };
    }

    const strOrderNo = createOrderNo(dtNow);
    const blnCreated = await createOrderFromCart(objSession.user.id, strOrderNo, objValidation.data);

    if (!blnCreated) {
        return { message: "購物車是空的，無法結帳", errors: {} };
    }

    redirect(`/checkout/complete/${strOrderNo}`);
}
