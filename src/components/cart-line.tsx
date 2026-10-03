/*
MobileWeb Cart Line
名稱：購物車項目列
說明：購物車頁的單一商品：圖片、名稱、單價、數量（可修改）、小計與移除

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
import { removeFromCartAction, updateCartQuantityAction } from "@/app/cart/actions";
import { useCart } from "@/components/cart-provider";
import PhoneImage from "@/components/phone-image";
import QuantityInput from "@/components/quantity-input";
import { formatPrice } from "@/lib/format";
import type { CartItem } from "@/lib/types";

interface CartLineProps {
    item: CartItem;
}

/**
 * 購物車項目列
 * @param {CartLineProps} _objProps 元件屬性
 * @returns {JSX.Element} 項目列
 */
export default function CartLine(_objProps: CartLineProps) {
    const objItem = _objProps.item;
    const objCart = useCart();
    const [intQuantity, setIntQuantity] = useState(objItem.quantity);
    const [blnFailed, setBlnFailed] = useState(false);
    const [blnPending, startTransition] = useTransition();

    /**
     * 修改數量並同步到伺服器
     * @param {number} _intQuantity 新數量
     * @returns {void}
     */
    function onQuantityChange(_intQuantity: number): void {
        setIntQuantity(_intQuantity);
        startTransition(async () => {
            const objResult = await updateCartQuantityAction(objItem.phoneSlug, _intQuantity);
            setBlnFailed(!objResult.ok);

            if (objResult.ok) {
                objCart.setCount(objResult.count);
            }
        });
    }

    /**
     * 移除此項目
     * @returns {void}
     */
    function onRemoveClick(): void {
        startTransition(async () => {
            const objResult = await removeFromCartAction(objItem.phoneSlug);
            setBlnFailed(!objResult.ok);

            if (objResult.ok) {
                objCart.setCount(objResult.count);
            }
        });
    }

    return (
        <li data-testid="cart-line" className="flex gap-4 py-4">
            <Link href={`/phones/${objItem.phoneSlug}`} className="w-24 shrink-0 sm:w-32">
                <PhoneImage name={objItem.phoneName} imageUrl={objItem.imageUrl} color={objItem.brandColor} />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <Link href={`/phones/${objItem.phoneSlug}`} className="font-semibold text-slate-900 hover:text-sky-700">
                        {objItem.phoneName}
                    </Link>
                    <p className="text-sm text-slate-500">單價 {formatPrice(objItem.unitPriceTwd)}</p>
                    {blnFailed && <p className="text-sm text-rose-600">更新失敗，請重新整理後再試</p>}
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                    <QuantityInput
                        label={`${objItem.phoneName} 數量`}
                        value={intQuantity}
                        onChange={onQuantityChange}
                        disabled={blnPending}
                    />
                    <p className="whitespace-nowrap text-right font-semibold text-slate-900 sm:w-28" data-testid="cart-line-subtotal">
                        {formatPrice(objItem.unitPriceTwd * intQuantity)}
                    </p>
                    <button
                        type="button"
                        onClick={onRemoveClick}
                        disabled={blnPending}
                        className="whitespace-nowrap text-sm text-slate-500 underline hover:text-rose-600 disabled:opacity-50"
                    >
                        移除
                    </button>
                </div>
            </div>
        </li>
    );
}
