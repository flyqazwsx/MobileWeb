/*
MobileWeb User Menu
名稱：頁首會員選單
說明：未登入顯示「登入／註冊」，登入後顯示使用者選單（帳號設定、登出）。
      登入狀態在瀏覽器端取得，頁面本身仍可靜態產生

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／會員註冊登入]
[2026-10-04] [flyqazwsx] [使用者選單改為「帳戶管理」與「訂單管理」]
*/

"use client";

import { AuthLoading, SignedIn, SignedOut, UserButton } from "@neondatabase/auth-ui";
import Link from "next/link";

/**
 * 頁首會員選單
 * @returns {JSX.Element} 會員選單
 */
export default function UserMenu() {
    return (
        <div className="ml-auto flex shrink-0 items-center gap-2 text-sm" data-testid="user-menu">
            <AuthLoading>
                <span className="inline-block h-8 w-20 animate-pulse rounded-full bg-slate-100" aria-hidden="true" />
            </AuthLoading>

            <SignedOut>
                <Link href="/auth/sign-in" className="rounded-full px-3 py-1.5 text-slate-700 hover:text-sky-700">
                    登入
                </Link>
                <Link href="/auth/sign-up" className="rounded-full bg-sky-600 px-3 py-1.5 font-medium text-white hover:bg-sky-700">
                    註冊
                </Link>
            </SignedOut>

            <SignedIn>
                {/* [2026-10-04] [下拉選單：帳戶管理（變更密碼）、訂單管理；取代預設的帳號設定連結] */}
                <UserButton
                    size="icon"
                    disableDefaultLinks
                    additionalLinks={[
                        { href: "/account/security", label: "帳戶管理", signedIn: true },
                        { href: "/orders", label: "訂單管理", signedIn: true },
                    ]}
                />
            </SignedIn>
        </div>
    );
}
