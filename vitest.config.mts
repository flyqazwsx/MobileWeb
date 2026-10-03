import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// [2026-10-03] [改接 Neon 資料庫] 載入本機連線字串，供資料存取層整合測試使用（檔案不存在時略過）
if (existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
}

// 單元測試設定：只跑 src 底下的 *.test.ts，E2E 測試由 Playwright 負責（e2e/）
export default defineConfig({
    resolve: {
        alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    test: {
        include: ["src/**/*.test.ts"],
        environment: "node",
        coverage: {
            provider: "v8",
            include: ["src/lib/**/*.ts", "src/data/**/*.ts"],
            exclude: ["src/lib/types.ts", "src/**/*.test.ts"],
            thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
        },
    },
});
