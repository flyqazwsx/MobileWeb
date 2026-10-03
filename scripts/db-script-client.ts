/*
MobileWeb DB Script Client
名稱：資料庫維運腳本共用連線
說明：建表、匯入等維運腳本使用直連（不經 PgBouncer）的 DATABASE_URL_UNPOOLED；
      未設定時退回 DATABASE_URL。環境變數由 npm script 以 --env-file=.env.local 載入

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／改接 Neon 資料庫]
*/

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * 建立維運腳本用的查詢函式
 * @returns {NeonQueryFunction<false, false>} Neon 查詢函式
 * @throws {Error} 兩個連線字串都未設定時
 */
export function createScriptSql(): NeonQueryFunction<false, false> {
    const strUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

    if (!strUrl) {
        throw new Error("未設定 DATABASE_URL_UNPOOLED／DATABASE_URL，請先執行 `npx vercel env pull .env.local`");
    }

    return neon(strUrl);
}
