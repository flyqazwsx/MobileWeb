/*
MobileWeb Account Page
名稱：會員帳號頁
說明：帳號設定（名稱、大頭貼、電子郵件）與安全性（變更密碼、登入裝置、刪除帳號）。
      未登入時由 src/proxy.ts 導向登入頁

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／會員註冊登入]
[2026-10-04] [flyqazwsx] [標題改為帳戶管理]
*/

import { AccountView } from "@neondatabase/auth-ui";
import { accountViewPaths } from "@neondatabase/auth-ui/server";
import type { Metadata } from "next";

export const dynamicParams = false;

export const metadata: Metadata = { title: "帳戶管理" };

/**
 * 產生帳號頁路徑（本站只開放帳號設定與安全性）
 * @returns {Array<{ path: string }>} 路徑清單
 */
export function generateStaticParams() {
    return [accountViewPaths.SETTINGS, accountViewPaths.SECURITY].map((_strPath) => ({ path: _strPath }));
}

/**
 * 會員帳號頁
 * @param {PageProps<"/account/[path]">} _objProps 頁面屬性
 * @returns {Promise<JSX.Element>} 帳號設定畫面
 */
export default async function AccountPage(_objProps: PageProps<"/account/[path]">) {
    const objParams = await _objProps.params;

    return (
        <div className="py-2">
            <h1 className="mb-4 text-2xl font-bold text-slate-900">帳戶管理</h1>
            <AccountView path={objParams.path} />
        </div>
    );
}
