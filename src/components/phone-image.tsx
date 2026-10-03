/*
MobileWeb Phone Image
名稱：手機圖片元件
說明：有圖片網址時顯示實際圖片；原型階段尚無圖片時以品牌色繪製手機外型佔位圖

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／基本原型]
*/

import Image from "next/image";

interface PhoneImageProps {
    name: string;
    imageUrl: string | null;
    color: string;
    className?: string;
}

/**
 * 手機圖片（或佔位圖）
 * @param {PhoneImageProps} _objProps 元件屬性
 * @returns {JSX.Element} 圖片區塊
 */
export default function PhoneImage(_objProps: PhoneImageProps) {
    if (_objProps.imageUrl) {
        return (
            <Image
                src={_objProps.imageUrl}
                alt={_objProps.name}
                width={300}
                height={400}
                className={`h-auto w-full object-contain ${_objProps.className ?? ""}`}
            />
        );
    }

    return (
        <svg
            role="img"
            aria-label={`${_objProps.name} 示意圖`}
            viewBox="0 0 120 160"
            className={`h-auto w-full ${_objProps.className ?? ""}`}
        >
            <rect x="0" y="0" width="120" height="160" rx="12" className="fill-slate-100" />
            <rect x="35" y="18" width="50" height="104" rx="9" fill={_objProps.color} />
            <rect x="38" y="24" width="44" height="92" rx="6" fill="#ffffff" opacity="0.12" />
            <circle cx="60" cy="21.5" r="1.6" fill="#ffffff" opacity="0.5" />
            <text x="60" y="142" textAnchor="middle" fontSize="7.5" className="fill-slate-500">
                {_objProps.name.length > 26 ? `${_objProps.name.slice(0, 25)}…` : _objProps.name}
            </text>
        </svg>
    );
}
