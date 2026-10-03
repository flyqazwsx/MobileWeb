import { expect, type Page } from "@playwright/test";

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
 * 填寫註冊表單並確認三個欄位都有值
 * @param {Page} _objPage 頁面
 * @param {string} _strEmail 電子郵件
 * @returns {Promise<void>}
 */
async function fillSignUpForm(_objPage: Page, _strEmail: string): Promise<void> {
    await expect(async () => {
        await _objPage.getByLabel("名稱").fill("E2E 測試");
        await _objPage.getByLabel("電子郵件").fill(_strEmail);
        await _objPage.getByLabel("密碼").fill(STR_TEST_PASSWORD);
        await expect(_objPage.getByLabel("名稱")).toHaveValue("E2E 測試", { timeout: 500 });
        await expect(_objPage.getByLabel("電子郵件")).toHaveValue(_strEmail, { timeout: 500 });
        await expect(_objPage.getByLabel("密碼")).toHaveValue(STR_TEST_PASSWORD, { timeout: 500 });
    }).toPass({ timeout: 10_000 });
}

/**
 * 以表單註冊新帳號
 * @param {Page} _objPage 頁面
 * @param {string} _strEmail 電子郵件
 * @param {boolean} _blnExpectSuccess 是否預期註冊成功（成功時網站會離開註冊頁）；測試重複註冊時傳 false
 * @returns {Promise<void>}
 */
export async function signUp(_objPage: Page, _strEmail: string, _blnExpectSuccess: boolean = true): Promise<void> {
    await _objPage.goto("/auth/sign-up");

    // 表單可能在填寫後被重新掛載而清空（實測密碼欄會被清掉），因此送出後確認結果，未達預期就重填再送
    if (!_blnExpectSuccess) {
        // 預期失敗（例如重複註冊）：重試到出現錯誤提示為止
        await expect(async () => {
            await fillSignUpForm(_objPage, _strEmail);
            await _objPage.getByRole("button", { name: "建立帳號" }).click();
            await expect(_objPage.locator("[data-sonner-toast]")).not.toHaveCount(0, { timeout: 5_000 });
        }).toPass({ timeout: 30_000 });
        return;
    }

    await expect(async () => {
        if (!_objPage.url().includes("/auth/sign-up")) {
            return;
        }

        await fillSignUpForm(_objPage, _strEmail);
        await _objPage.getByRole("button", { name: "建立帳號" }).click();
        await expect(_objPage).not.toHaveURL(/\/auth\/sign-up/, { timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
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
