/*
MobileWeb Add To Cart
名稱：加入購物車
說明：手機詳細頁的購買區塊。已登入：選數量後加入購物車；未登入：顯示「登入後購買」，
      登入後回到原本的手機頁（登入頁讀取 redirectTo 參數）

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／購物車]
*/

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addToCartAction, type CartFailReason } from "@/app/cart/actions";
import { useCart } from "@/components/cart-provider";
import QuantityInput from "@/components/quantity-input";

interface AddToCartProps {
    phoneSlug: string;
    phoneName: string;
}

/** 失敗原因對應的提示文字 */
const objFailMessages: Record<CartFailReason, string> = {
    "unauthenticated": "請先登入會員",
    "invalid-quantity": "數量必須是 1–99",
    "not-found": "找不到這支手機",
};

/**
 * 加入購物車區塊
 * @param {AddToCartProps} _objProps 元件屬性
 * @returns {JSX.Element} 數量選擇與加入按鈕，或登入連結
 */
export default function AddToCart(_objProps: AddToCartProps) {
    const objCart = useCart();
    const [intQuantity, setIntQuantity] = useState(1);
    const [strMessage, setStrMessage] = useState("");
    const [blnError, setBlnError] = useState(false);
    const [blnPending, startTransition] = useTransition();

    if (objCart.isSessionPending) {
        return <div className="mt-4 h-10 w-56 animate-pulse rounded-lg bg-slate-100" data-testid="add-to-cart" aria-hidden="true" />;
    }

    if (!objCart.isSignedIn) {
        return (
            <div className="mt-4" data-testid="add-to-cart">
                <Link
                    href={`/auth/sign-in?redirectTo=${encodeURIComponent(`/phones/${_objProps.phoneSlug}`)}`}
                    className="inline-block rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
                >
                    登入後購買
                </Link>
                <p className="mt-2 text-xs text-slate-500">註冊會員即可將手機加入購物車。</p>
            </div>
        );
    }

    /**
     * 送出加入購物車
     * @returns {void}
     */
    function onAddClick(): void {
        setStrMessage("");
        startTransition(async () => {
            const objResult = await addToCartAction(_objProps.phoneSlug, intQuantity);

            if (objResult.ok) {
                objCart.setCount(objResult.count);
                setBlnError(false);
                setStrMessage(`已將 ${intQuantity} 件「${_objProps.phoneName}」加入購物車`);
                return;
            }

            setBlnError(true);
            setStrMessage(objFailMessages[objResult.reason]);
        });
    }

    return (
        <div className="mt-4" data-testid="add-to-cart">
            <div className="flex flex-wrap items-center gap-3">
                <QuantityInput label="購買數量" value={intQuantity} onChange={setIntQuantity} disabled={blnPending} />
                <button
                    type="button"
                    onClick={onAddClick}
                    disabled={blnPending}
                    className="rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                >
                    {blnPending ? "加入中…" : "加入購物車"}
                </button>
            </div>
            {strMessage && (
                <p role="status" className={`mt-2 text-sm ${blnError ? "text-rose-600" : "text-emerald-700"}`}>
                    {strMessage}{" "}
                    {!blnError && (
                        <Link href="/cart" className="underline">
                            前往購物車
                        </Link>
                    )}
                </p>
            )}
        </div>
    );
}
