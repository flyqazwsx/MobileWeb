/*
MobileWeb Not Found Page
名稱：找不到頁面
說明：未知品牌、未知手機或其他不存在的網址

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／基本原型]
*/

import Link from "next/link";

/**
 * 404 頁面
 * @returns {JSX.Element} 頁面
 */
export default function NotFound() {
    return (
        <section className="py-16 text-center">
            <h1 className="text-2xl font-bold text-slate-900">找不到這個頁面</h1>
            <p className="mt-2 text-slate-500">這支手機或品牌可能還沒收錄。</p>
            <Link href="/" className="mt-6 inline-block rounded-full bg-sky-600 px-5 py-2 text-white hover:bg-sky-700">
                回到首頁
            </Link>
        </section>
    );
}
