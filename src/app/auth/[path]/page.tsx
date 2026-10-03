/*
MobileWeb Auth Page
名稱：會員驗證頁
說明：登入、註冊、忘記密碼、重設密碼、登出等頁面，依網址 /auth/{path} 顯示對應表單

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／會員註冊登入]
*/

import { AuthView } from "@neondatabase/auth-ui";
import { authViewPaths } from "@neondatabase/auth-ui/server";
import type { Metadata } from "next";

export const dynamicParams = false;

/** 各驗證頁的標題 */
const objPageTitles: Record<string, string> = {
    [authViewPaths.SIGN_IN]: "會員登入",
    [authViewPaths.SIGN_UP]: "註冊會員",
    [authViewPaths.FORGOT_PASSWORD]: "忘記密碼",
    [authViewPaths.RESET_PASSWORD]: "重設密碼",
    [authViewPaths.SIGN_OUT]: "登出",
};

/**
 * 產生所有驗證頁路徑
 * @returns {Array<{ path: string }>} 路徑清單
 */
export function generateStaticParams() {
    return Object.values(authViewPaths).map((_strPath) => ({ path: _strPath }));
}

/**
 * 頁面標題
 * @param {PageProps<"/auth/[path]">} _objProps 頁面屬性
 * @returns {Promise<Metadata>} 頁面中繼資料
 */
export async function generateMetadata(_objProps: PageProps<"/auth/[path]">): Promise<Metadata> {
    const objParams = await _objProps.params;
    return { title: objPageTitles[objParams.path] ?? "會員" };
}

/**
 * 會員驗證頁
 * @param {PageProps<"/auth/[path]">} _objProps 頁面屬性
 * @returns {Promise<JSX.Element>} 驗證表單
 */
export default async function AuthPage(_objProps: PageProps<"/auth/[path]">) {
    const objParams = await _objProps.params;

    return (
        <div className="flex justify-center py-6">
            <AuthView path={objParams.path} />
        </div>
    );
}
