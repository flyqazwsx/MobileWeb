import { defineConfig, devices } from "@playwright/test";

// E2E 測試：先 build 再以 next start 啟動（port 3100，避免與 dev server 的 3000 衝突）
const INT_E2E_PORT = 3100;

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    reporter: "list",
    // 會員測試註冊的 e2e-*@example.com 帳號於全部測試結束後清除
    globalTeardown: "./e2e/global-teardown.ts",
    use: {
        baseURL: `http://localhost:${INT_E2E_PORT}`,
        trace: "on-first-retry",
    },
    projects: [
        { name: "desktop", use: { ...devices["Desktop Chrome"] } },
        { name: "mobile", use: { ...devices["Pixel 7"] } },
    ],
    webServer: {
        command: `npm run build && npx next start -p ${INT_E2E_PORT}`,
        url: `http://localhost:${INT_E2E_PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
    },
});
