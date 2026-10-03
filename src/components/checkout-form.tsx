/*
MobileWeb Checkout Form
名稱：結帳表單
說明：收件資訊與付款方式（目前只有信用卡）。欄位預填示範資料，使用者直接按「確認付款」即可完成結帳

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／結帳]
*/

"use client";

import { useActionState } from "react";
import { placeOrderAction, type CheckoutState } from "@/app/checkout/actions";
import { objDummyCheckout, type CheckoutFormInput } from "@/lib/checkout";
import { formatPrice } from "@/lib/format";

interface CheckoutFormProps {
    totalTwd: number;
}

/** 表單初始狀態 */
const objInitialState: CheckoutState = { message: "", errors: {} };

interface FieldProps {
    name: keyof CheckoutFormInput;
    label: string;
    errors: CheckoutState["errors"];
    values: CheckoutState["values"];
    autoComplete?: string;
    inputMode?: "text" | "numeric" | "tel";
    className?: string;
}

/**
 * 單一輸入欄位（預填示範資料）
 * @param {FieldProps} _objProps 欄位屬性
 * @returns {JSX.Element} 標籤、輸入框與錯誤訊息
 */
function Field(_objProps: FieldProps) {
    const strError = _objProps.errors[_objProps.name];
    const strErrorId = `${_objProps.name}-error`;

    return (
        <div className={_objProps.className}>
            <label htmlFor={_objProps.name} className="mb-1 block text-sm font-medium text-slate-700">
                {_objProps.label}
            </label>
            <input
                id={_objProps.name}
                name={_objProps.name}
                defaultValue={_objProps.values?.[_objProps.name] ?? objDummyCheckout[_objProps.name]}
                autoComplete={_objProps.autoComplete ?? "off"}
                inputMode={_objProps.inputMode}
                aria-invalid={strError ? true : undefined}
                aria-describedby={strError ? strErrorId : undefined}
                className={`w-full rounded-lg border px-3 py-2 text-sm ${strError ? "border-rose-500" : "border-slate-300"}`}
            />
            {strError && (
                <p id={strErrorId} className="mt-1 text-xs text-rose-600">
                    {strError}
                </p>
            )}
        </div>
    );
}

/**
 * 結帳表單
 * @param {CheckoutFormProps} _objProps 元件屬性
 * @returns {JSX.Element} 表單
 */
export default function CheckoutForm(_objProps: CheckoutFormProps) {
    const [objState, fnFormAction, blnPending] = useActionState(placeOrderAction, objInitialState);

    return (
        <form action={fnFormAction} className="space-y-6" noValidate>
            <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="mb-3 text-lg font-bold text-slate-900">收件資訊</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field name="recipientName" label="收件人" errors={objState.errors} values={objState.values} />
                    <Field name="recipientPhone" label="手機號碼" errors={objState.errors} values={objState.values} inputMode="tel" />
                    <Field name="shippingAddress" label="收件地址" errors={objState.errors} values={objState.values} className="sm:col-span-2" />
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="mb-3 text-lg font-bold text-slate-900">付款方式</h2>
                <label className="flex items-center gap-2 text-sm text-slate-800">
                    <input type="radio" name="paymentMethod" value="CREDIT_CARD" defaultChecked />
                    信用卡
                </label>
                {objState.errors.paymentMethod && <p className="mt-1 text-xs text-rose-600">{objState.errors.paymentMethod}</p>}

                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    示範網站：已預填測試卡號，請勿輸入真實信用卡。卡號、有效期限與安全碼不會被儲存，訂單只保留卡別與末四碼。
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field name="cardHolder" label="持卡人姓名" errors={objState.errors} values={objState.values} className="sm:col-span-2" />
                    <Field name="cardNumber" label="信用卡號碼" errors={objState.errors} values={objState.values} inputMode="numeric" className="sm:col-span-2" />
                    <Field name="cardExpiry" label="有效期限（MM/YY）" errors={objState.errors} values={objState.values} inputMode="numeric" />
                    <Field name="cardCvc" label="安全碼" errors={objState.errors} values={objState.values} inputMode="numeric" />
                </div>
            </section>

            {objState.message && (
                <p role="alert" className="text-sm font-medium text-rose-600">
                    {objState.message}
                </p>
            )}

            <button
                type="submit"
                disabled={blnPending}
                className="w-full rounded-lg bg-rose-600 px-5 py-3 font-medium text-white hover:bg-rose-700 disabled:opacity-60 sm:w-auto"
            >
                {blnPending ? "付款處理中…" : `確認付款 ${formatPrice(_objProps.totalTwd)}`}
            </button>
        </form>
    );
}
