/*
MobileWeb E2E Global Teardown
名稱：E2E 測試帳號清除
說明：E2E 註冊的測試帳號（e2e-*@example.com）在全部測試結束後從 Neon Auth 的 neon_auth."user" 刪除；
      session、account 等關聯資料表的外鍵為 ON DELETE CASCADE，會一併刪除。
      Neon 代管的 Better Auth 沒有 delete-user API，因此直接以 SQL 清除

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／會員註冊登入]
*/

import { existsSync } from "node:fs";
import { createScriptSql } from "../scripts/db-script-client";

/** 測試帳號的電子郵件比對樣式（SQL LIKE） */
export const STR_E2E_EMAIL_PATTERN = "e2e-%@example.com";

/**
 * 刪除所有 E2E 測試帳號
 * @returns {Promise<void>}
 */
export default async function deleteE2eUsers(): Promise<void> {
    if (!process.env.DATABASE_URL && existsSync(".env.local")) {
        process.loadEnvFile(".env.local");
    }

    if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_UNPOOLED) {
        console.warn("未設定 DATABASE_URL，略過 E2E 測試帳號清除");
        return;
    }

    const objSql = createScriptSql();
    const arrRows = await objSql.query('DELETE FROM neon_auth."user" WHERE email LIKE $1 RETURNING id', [STR_E2E_EMAIL_PATTERN]);
    console.log(`已清除 E2E 測試帳號 ${arrRows.length} 筆`);
}
