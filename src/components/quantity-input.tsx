/*
MobileWeb Quantity Input
名稱：數量選擇器
說明：「－ 數量 ＋」輸入元件，數量限制在 1–99；加入購物車與購物車頁共用

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／購物車]
*/

"use client";

import { clampCartQuantity, INT_MAX_CART_QUANTITY, INT_MIN_CART_QUANTITY } from "@/lib/cart";

interface QuantityInputProps {
    /** 目前數量 */
    value: number;
    /** 數量改變時（已限制在 1–99） */
    onChange: (_intQuantity: number) => void;
    /** 無障礙標籤，例如「數量」 */
    label: string;
    disabled?: boolean;
}

/**
 * 數量選擇器
 * @param {QuantityInputProps} _objProps 元件屬性
 * @returns {JSX.Element} 數量輸入
 */
export default function QuantityInput(_objProps: QuantityInputProps) {
    const strButtonClass =
        "h-9 w-9 text-lg text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent";

    return (
        <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white">
            <button
                type="button"
                aria-label="減少數量"
                className={strButtonClass}
                disabled={_objProps.disabled || _objProps.value <= INT_MIN_CART_QUANTITY}
                onClick={() => _objProps.onChange(clampCartQuantity(_objProps.value - 1))}
            >
                −
            </button>
            <input
                type="number"
                inputMode="numeric"
                aria-label={_objProps.label}
                min={INT_MIN_CART_QUANTITY}
                max={INT_MAX_CART_QUANTITY}
                value={_objProps.value}
                disabled={_objProps.disabled}
                onChange={(_objEvent) => _objProps.onChange(clampCartQuantity(Number(_objEvent.target.value)))}
                className="h-9 w-12 border-x border-slate-300 text-center text-sm [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
                type="button"
                aria-label="增加數量"
                className={strButtonClass}
                disabled={_objProps.disabled || _objProps.value >= INT_MAX_CART_QUANTITY}
                onClick={() => _objProps.onChange(clampCartQuantity(_objProps.value + 1))}
            >
                +
            </button>
        </div>
    );
}
