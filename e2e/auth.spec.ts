import { expect, test } from "@playwright/test";
import { createTestEmail, signOutFromMenu, signUp, STR_TEST_PASSWORD } from "./auth-helpers";

// User Story：訪客註冊會員後可登入、查看會員專區並登出；未登入時無法進入會員專區
// 測試帳號一律使用 e2e-*@example.com，由 e2e/global-teardown.ts 於測試結束後清除

test.describe("會員註冊與登入", () => {
    test("未登入時頁首顯示登入與註冊", async ({ page }) => {
        await page.goto("/");
        const locMenu = page.getByTestId("user-menu");
        await expect(locMenu.getByRole("link", { name: "登入" })).toHaveAttribute("href", "/auth/sign-in");
        await expect(locMenu.getByRole("link", { name: "註冊" })).toHaveAttribute("href", "/auth/sign-up");
    });

    test("未登入進入會員專區會被導向登入頁", async ({ page }) => {
        await page.goto("/account/settings");
        await expect(page).toHaveURL(/\/auth\/sign-in/);
        await expect(page.getByRole("button", { name: "登入" })).toBeVisible();
    });

    test("註冊 → 會員專區 → 登出 → 再登入", async ({ page }, objTestInfo) => {
        const strEmail = createTestEmail(`auth-${objTestInfo.project.name}`);

        // 註冊成功後回到首頁，頁首改為使用者選單
        await signUp(page, strEmail);
        await expect(page).toHaveURL(/\/$/);
        await expect(page.getByTestId("user-menu").getByRole("link", { name: "登入" })).toHaveCount(0);

        // 會員專區顯示自己的電子郵件
        await page.goto("/account/settings");
        await expect(page.getByRole("heading", { name: "帳戶管理" })).toBeVisible();
        await expect(page.locator(`input[value="${strEmail}"]`)).toBeVisible();

        // 登出後頁首恢復登入連結，會員專區再次被擋
        await signOutFromMenu(page);
        await expect(page.getByTestId("user-menu").getByRole("link", { name: "登入" })).toBeVisible();
        await page.goto("/account/settings");
        await expect(page).toHaveURL(/\/auth\/sign-in/);

        // 以剛註冊的帳號登入
        await page.getByLabel("電子郵件").fill(strEmail);
        await page.getByLabel("密碼").fill(STR_TEST_PASSWORD);
        await page.getByRole("button", { name: "登入" }).click();
        await expect(page.getByTestId("user-menu").getByRole("link", { name: "登入" })).toHaveCount(0);
    });

    test("密碼錯誤時顯示中文錯誤訊息且維持未登入", async ({ page }, objTestInfo) => {
        const strEmail = createTestEmail(`auth-${objTestInfo.project.name}`);
        await signUp(page, strEmail);
        await expect(page).toHaveURL(/\/$/);
        await signOutFromMenu(page);

        await page.goto("/auth/sign-in");
        await page.getByLabel("電子郵件").fill(strEmail);
        await page.getByLabel("密碼").fill("wrong-password-123");
        await page.getByRole("button", { name: "登入" }).click();

        await expect(page.getByText("電子郵件或密碼錯誤")).toBeVisible();
        await expect(page).toHaveURL(/\/auth\/sign-in/);
    });

    test("重複的電子郵件無法再次註冊", async ({ page }, objTestInfo) => {
        const strEmail = createTestEmail(`auth-${objTestInfo.project.name}`);
        await signUp(page, strEmail);
        await expect(page).toHaveURL(/\/$/);
        await signOutFromMenu(page);

        await signUp(page, strEmail, false);
        await expect(page.getByText("這個電子郵件已經註冊過")).toBeVisible();
        await expect(page).toHaveURL(/\/auth\/sign-up/);
    });
});
