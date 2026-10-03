/*
MobileWeb Auth Server
名稱：會員驗證（伺服器端）
說明：建立 Neon Auth（Managed Better Auth）伺服器實例，供 API 路由、proxy 與伺服器元件使用。
      Auth URL 由 Vercel Marketplace 的 Neon 整合注入（前綴 DATABASE，即 DATABASE_NEON_AUTH_BASE_URL）；
      cookie 加密金鑰 NEON_AUTH_COOKIE_SECRET 另行設定於 Vercel 環境變數

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／會員註冊登入]
*/

import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * 取得 Neon Auth 的 Auth URL（整合注入的名稱優先，其次為官方文件的標準名稱）
 * @returns {string} Auth URL；未設定時回傳空字串，由套件在實際呼叫時回報錯誤
 */
export function getAuthBaseUrl(): string {
    return process.env.DATABASE_NEON_AUTH_BASE_URL ?? process.env.NEON_AUTH_BASE_URL ?? "";
}

/** Neon Auth 伺服器實例 */
export const auth = createNeonAuth({
    baseUrl: getAuthBaseUrl(),
    cookies: {
        secret: process.env.NEON_AUTH_COOKIE_SECRET ?? "",
    },
});
