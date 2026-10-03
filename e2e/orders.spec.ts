import { expect, test, type Page } from "@playwright/test";
import { createTestEmail, signOutFromMenu, signUp, STR_TEST_PASSWORD } from "./auth-helpers";

// User Story：會員從頁首人名的下拉選單進入「帳戶管理」修改密碼，或進入「訂單管理」查看訂單、取消訂單、查看物流
// 測試帳號（e2e-*@example.com）與其訂單由 e2e/global-teardown.ts 於測試結束後清除

/**
 * 開啟頁首使用者下拉選單
 * @param {Page} _objPage 頁面
 * @returns {Promise<void>}
 */
async function openUserMenu(_objPage: Page): Promise<void> {
    await _objPage.getByTestId("user-menu").getByRole("button").click();
}

/**
 * 加入一支手機並以示範資料完成結帳
 * @param {Page} _objPage 頁面
 * @returns {Promise<string>} 訂單編號
 */
async function placeOrder(_objPage: Page): Promise<string> {
    await _objPage.goto("/phones/galaxy-s25");
    await _objPage.getByTestId("add-to-cart").getByRole("button", { name: "加入購物車" }).click();
    await expect(_objPage.getByTestId("cart-count")).toHaveText("1");
    await _objPage.goto("/checkout");
    await _objPage.getByRole("button", { name: /確認付款/ }).click();
    await expect(_objPage).toHaveURL(/\/checkout\/complete\//);
    return (await _objPage.getByTestId("order-no").textContent()) ?? "";
}

test("未登入進入訂單管理會被導向登入頁", async ({ page }) => {
    await page.goto("/orders");
    await expect(page).toHaveURL(/\/auth\/sign-in/);
});

test.describe("會員下拉選單", () => {
    test("中間有「帳戶管理」與「訂單管理」兩個選項", async ({ page }, objTestInfo) => {
        await signUp(page, createTestEmail(`menu-${objTestInfo.project.name}`));
        await expect(page).toHaveURL(/\/$/);

        await openUserMenu(page);
        await expect(page.getByRole("menuitem")).toHaveText(["帳戶管理", "訂單管理", "登出"]);

        await page.getByRole("menuitem", { name: "訂單管理" }).click();
        await expect(page).toHaveURL(/\/orders$/);
        await expect(page.getByText("目前沒有訂單。")).toBeVisible();
    });

    test("帳戶管理可以修改密碼，之後以新密碼登入", async ({ page }, objTestInfo) => {
        const strEmail = createTestEmail(`password-${objTestInfo.project.name}`);
        const strNewPassword = "New-Passw0rd-Test!";
        await signUp(page, strEmail);
        await expect(page).toHaveURL(/\/$/);

        await openUserMenu(page);
        await page.getByRole("menuitem", { name: "帳戶管理" }).click();
        await expect(page).toHaveURL(/\/account\/security$/);
        await expect(page.getByRole("heading", { name: "帳戶管理" })).toBeVisible();

        await page.getByLabel("目前的密碼").fill(STR_TEST_PASSWORD);
        await page.getByLabel("新密碼").fill(strNewPassword);
        await page.getByRole("button", { name: "儲存" }).first().click();
        await expect(page.getByText("密碼已變更。")).toBeVisible();

        await signOutFromMenu(page);
        await page.goto("/auth/sign-in");
        await page.getByLabel("電子郵件").fill(strEmail);
        await page.getByLabel("密碼").fill(strNewPassword);
        await page.getByRole("button", { name: "登入" }).click();
        await expect(page.getByTestId("user-menu").getByRole("link", { name: "登入" })).toHaveCount(0);
    });
});

test.describe("訂單管理", () => {
    test("查看訂單資訊 → 查看物流 → 取消訂單", async ({ page }, objTestInfo) => {
        await signUp(page, createTestEmail(`orders-${objTestInfo.project.name}`));
        await expect(page).toHaveURL(/\/$/);
        const strOrderNo = await placeOrder(page);

        // 從下拉選單進入訂單管理
        await openUserMenu(page);
        await page.getByRole("menuitem", { name: "訂單管理" }).click();
        const locCard = page.getByTestId("order-card").filter({ hasText: strOrderNo });
        await expect(locCard).toContainText("Samsung Galaxy S25 × 1");
        await expect(locCard).toContainText("信用卡 VISA **** 4242");
        await expect(locCard.getByTestId("order-status")).toHaveText("已付款・訂單成立");

        // 查看物流
        await locCard.getByRole("link", { name: "查看物流" }).click();
        await expect(page).toHaveURL(new RegExp(`/orders/${strOrderNo}/tracking$`));
        await expect(page.getByTestId("tracking-no")).toHaveText(/^9\d{11}$/);
        await expect(page.getByTestId("tracking-event")).toHaveCount(5);
        await expect(page.getByTestId("tracking-event").first()).toHaveAttribute("data-done", "true");
        await expect(page.getByTestId("tracking-event").nth(2)).toHaveAttribute("data-done", "false");
        await page.getByRole("link", { name: "← 返回訂單管理" }).click();

        // 取消訂單（確認對話框按確定）
        page.once("dialog", (_objDialog) => void _objDialog.accept());
        await locCard.getByRole("button", { name: "取消訂單" }).click();
        await expect(locCard.getByTestId("order-status")).toHaveText("已取消");
        await expect(locCard.getByRole("button", { name: "取消訂單" })).toHaveCount(0);
        await expect(locCard).toContainText("取消時間");

        // 已取消的訂單沒有物流資訊
        await locCard.getByRole("link", { name: "查看物流" }).click();
        await expect(page.getByTestId("tracking-empty")).toHaveText("此訂單已取消，沒有物流資訊。");
    });

    test("取消時在確認對話框按取消，訂單維持原狀", async ({ page }, objTestInfo) => {
        await signUp(page, createTestEmail(`orders-keep-${objTestInfo.project.name}`));
        await expect(page).toHaveURL(/\/$/);
        const strOrderNo = await placeOrder(page);

        await page.goto("/orders");
        const locCard = page.getByTestId("order-card").filter({ hasText: strOrderNo });
        page.once("dialog", (_objDialog) => void _objDialog.dismiss());
        await locCard.getByRole("button", { name: "取消訂單" }).click();
        await expect(locCard.getByTestId("order-status")).toHaveText("已付款・訂單成立");
        await expect(locCard.getByRole("button", { name: "取消訂單" })).toBeVisible();
    });

    test("看不到不存在或別人的訂單物流", async ({ page }, objTestInfo) => {
        await signUp(page, createTestEmail(`orders-404-${objTestInfo.project.name}`));
        await expect(page).toHaveURL(/\/$/);
        const objResponse = await page.goto("/orders/MW20260101-AAAAAA/tracking");
        expect(objResponse?.status()).toBe(404);
    });
});
