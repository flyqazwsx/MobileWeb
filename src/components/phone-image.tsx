/*
MobileWeb Phone Image
名稱：手機圖片元件
說明：有圖片網址時顯示實際產品圖；尚無圖片時以品牌色繪製手機外型佔位圖。
      兩者統一為 4:3 框，卡片列表混用時高度一致

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／基本原型]
[2026-10-03] [flyqazwsx] [改顯示實際產品圖，圖片與佔位圖統一為 4:3]
*/

import Image from "next/image";

interface PhoneImageProps {
    name: string;
    imageUrl: string | null;
    color: string;
    className?: string;
}

/** 產品圖原始寬度（手機王產品圖為 640x480） */
const INT_IMAGE_WIDTH = 640;

/** 產品圖原始高度 */
const INT_IMAGE_HEIGHT = 480;

/**
 * 手機圖片（或佔位圖）
 * @param {PhoneImageProps} _objProps 元件屬性
 * @returns {JSX.Element} 圖片區塊
 */
export default function PhoneImage(_objProps: PhoneImageProps) {
    // [2026-10-03] [有圖片時改用 4:3 白底框顯示實際產品圖]
    if (_objProps.imageUrl) {
        return (
            <div className={`aspect-[4/3] w-full overflow-hidden rounded-xl bg-white ${_objProps.className ?? ""}`}>
                <Image
                    src={_objProps.imageUrl}
                    alt={_objProps.name}
                    width={INT_IMAGE_WIDTH}
                    height={INT_IMAGE_HEIGHT}
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="h-full w-full object-contain"
                />
            </div>
        );
    }

    // [2026-10-03] [佔位圖改為 4:3 比例]
    return (
        <svg
            role="img"
            aria-label={`${_objProps.name} 示意圖`}
            viewBox="0 0 160 120"
            className={`aspect-[4/3] h-auto w-full ${_objProps.className ?? ""}`}
        >
            <rect x="0" y="0" width="160" height="120" rx="10" className="fill-slate-100" />
            <rect x="62" y="12" width="36" height="74" rx="7" fill={_objProps.color} />
            <rect x="64.5" y="16.5" width="31" height="65" rx="4.5" fill="#ffffff" opacity="0.12" />
            <circle cx="80" cy="14.5" r="1.2" fill="#ffffff" opacity="0.5" />
            <text x="80" y="104" textAnchor="middle" fontSize="7.5" className="fill-slate-500">
                {_objProps.name.length > 30 ? `${_objProps.name.slice(0, 29)}…` : _objProps.name}
            </text>
        </svg>
    );
}
