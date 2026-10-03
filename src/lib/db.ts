/*
MobileWeb Database Client
名稱：Neon 資料庫連線
說明：以 Neon serverless driver 的 HTTP 模式查詢（適合 Vercel Functions 的一次性查詢）。
      連線字串由 Vercel Marketplace 的 Neon 整合注入 DATABASE_URL；本機以 `vercel env pull` 取得

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／改接 Neon 資料庫]
*/

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/** 連線字串所在的環境變數名稱 */
const STR_DATABASE_URL_ENV = "DATABASE_URL";

let objSqlClient: NeonQueryFunction<false, false> | null = null;

/**
 * 取得查詢函式（首次呼叫時建立，之後重複使用）
 * @returns {NeonQueryFunction<false, false>} Neon 查詢函式
 * @throws {Error} 未設定 DATABASE_URL 時
 */
export function getSql(): NeonQueryFunction<false, false> {
    if (objSqlClient) {
        return objSqlClient;
    }

    const strUrl = process.env[STR_DATABASE_URL_ENV];

    if (!strUrl) {
        throw new Error(`未設定 ${STR_DATABASE_URL_ENV}，請先執行 \`npx vercel env pull .env.local\``);
    }

    objSqlClient = neon(strUrl);
    return objSqlClient;
}
