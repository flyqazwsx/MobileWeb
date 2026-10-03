import type { Page } from "@playwright/test";

// E2E 共用的會員操作；測試帳號一律使用 e2e-*@example.com，由 e2e/global-teardown.ts 於測試結束後清除

/** 測試帳號密碼 */
export const STR_TEST_PASSWORD = "E2e-Passw0rd-Test!";

/**
 * 產生不重複的測試電子郵件
 * @param {string} _strPrefix 前綴（通常為功能名稱 + Playwright project 名稱）
 * @returns {string} 電子郵件
 */
export function createTestEmail(_strPrefix: string): string {
    return `e2e-${_strPrefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

/**
 * 以表單註冊新帳號（成功後網站導回首頁）
 * @param {Page} _objPage 頁面
 * @param {string} _strEmail 電子郵件
 * @returns {Promise<void>}
 */
export async function signUp(_objPage: Page, _strEmail: string): Promise<void> {
    await _objPage.goto("/auth/sign-up");
    await _objPage.getByLabel("名稱").fill("E2E 測試");
    await _objPage.getByLabel("電子郵件").fill(_strEmail);
    await _objPage.getByLabel("密碼").fill(STR_TEST_PASSWORD);
    await _objPage.getByRole("button", { name: "建立帳號" }).click();
}

/**
 * 從頁首使用者選單登出
 * @param {Page} _objPage 頁面
 * @returns {Promise<void>}
 */
export async function signOutFromMenu(_objPage: Page): Promise<void> {
    await _objPage.getByTestId("user-menu").getByRole("button").click();
    await _objPage.getByRole("menuitem", { name: "登出" }).click();
}
