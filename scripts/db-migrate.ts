/*
MobileWeb DB Migrate
名稱：建立資料表
說明：依檔名順序執行 db/migrations/*.sql。SQL 檔內的敘述皆為 IF NOT EXISTS，可重複執行
用法：npm run db:migrate

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／改接 Neon 資料庫]
*/

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createScriptSql } from "./db-script-client";

/** migration 檔案所在資料夾 */
const STR_MIGRATION_DIR = path.join(process.cwd(), "db", "migrations");

/**
 * 拆出 SQL 檔中的各個敘述（先移除註解，再以分號切開）
 * @param {string} _strSql SQL 檔內容
 * @returns {string[]} 敘述清單
 */
function splitSqlStatements(_strSql: string): string[] {
    return _strSql
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/--.*$/gm, "")
        .split(";")
        .map((_strStatement) => _strStatement.trim())
        .filter((_strStatement) => _strStatement.length > 0);
}

/**
 * 依序執行所有 migration
 * @returns {Promise<void>}
 */
async function runMigrations(): Promise<void> {
    const objSql = createScriptSql();
    const arrFiles = (await readdir(STR_MIGRATION_DIR)).filter((_strFile) => _strFile.endsWith(".sql")).sort();

    for (const strFile of arrFiles) {
        const arrStatements = splitSqlStatements(await readFile(path.join(STR_MIGRATION_DIR, strFile), "utf8"));

        for (const strStatement of arrStatements) {
            await objSql.query(strStatement);
        }

        console.log(`✓ ${strFile}（${arrStatements.length} 個敘述）`);
    }
}

runMigrations().catch((_objError: unknown) => {
    console.error("建立資料表失敗：", _objError instanceof Error ? _objError.message : _objError);
    process.exitCode = 1;
});
