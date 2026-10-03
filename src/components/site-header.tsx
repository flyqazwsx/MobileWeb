/*
MobileWeb Site Header
名稱：網站頁首
說明：網站名稱與品牌選單；手機寬度時品牌選單可左右滑動

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／基本原型]
[2026-10-03] [flyqazwsx] [右上角加入會員選單]
[2026-10-04] [flyqazwsx] [右上角加入購物車件數圖示]
*/

import Link from "next/link";
import CartIcon from "@/components/cart-icon";
import UserMenu from "@/components/user-menu";
import { getBrands } from "@/lib/phone-repository";

/**
 * 網站頁首（伺服器元件）
 * @returns {Promise<JSX.Element>} 頁首
 */
export default async function SiteHeader() {
    const arrBrands = await getBrands();

    return (
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
                <Link href="/" className="shrink-0 text-xl font-bold text-slate-900">
                    📱 MobileWeb
                </Link>
                <span className="hidden text-sm text-slate-500 sm:inline">全台手機規格與價格一次看</span>
                {/* [2026-10-03] [會員選單：登入／註冊或使用者選單] */}
                <UserMenu />
                {/* [2026-10-04] [購物車件數圖示，點擊進入購物車頁] */}
                <CartIcon />
            </div>
            <nav aria-label="品牌選單" className="mx-auto max-w-6xl overflow-x-auto px-4 pb-2">
                <ul className="flex gap-2 whitespace-nowrap">
                    {arrBrands.map((_objBrand) => (
                        <li key={_objBrand.slug}>
                            <Link
                                href={`/brands/${_objBrand.slug}`}
                                className="inline-block rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 transition hover:border-sky-500 hover:text-sky-700"
                            >
                                {_objBrand.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </header>
    );
}
