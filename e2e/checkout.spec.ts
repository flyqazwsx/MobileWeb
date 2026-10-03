import { expect, test, type Page } from "@playwright/test";
import { createTestEmail, signUp } from "./auth-helpers";

// User Story：會員在購物車按「結帳」進入結帳頁，看到訂單資訊，以預填的示範收件資料與測試信用卡直接送出完成結帳
// 測試帳號（e2e-*@example.com）與其訂單由 e2e/global-teardown.ts 於測試結束後清除

/**
 * 註冊後把一支手機加入購物車並進入結帳頁
 * @param {Page} _objPage 頁面
 * @param {string} _strPrefix 測試帳號前綴
 * @returns {Promise<void>}
 */
async function goToCheckoutWithItem(_objPage: Page, _strPrefix: string): Promise<void> {
    await signUp(_objPage, createTestEmail(_strPrefix));
    await expect(_objPage).toHaveURL(/\/$/);

    await _objPage.goto("/phones/pixel-10");
    const locBox = _objPage.getByTestId("add-to-cart");
    await locBox.getByLabel("購買數量").fill("2");
    await locBox.getByRole("button", { name: "加入購物車" }).click();
    await expect(_objPage.getByTestId("cart-count")).toHaveText("2");

    await _objPage.goto("/cart");
    await _objPage.getByRole("link", { name: "結帳" }).click();
    await expect(_objPage).toHaveURL(/\/checkout$/);
}

test("未登入進入結帳頁會被導向登入頁", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/auth\/sign-in/);
});

test.describe("結帳", () => {
    test("結帳頁顯示訂單資訊與預填資料，直接送出即完成結帳", async ({ page }, objTestInfo) => {
        await goToCheckoutWithItem(page, `checkout-${objTestInfo.project.name}`);

        // 訂單資訊
        const locSummary = page.getByTestId("order-summary");
        await expect(locSummary).toContainText("Google Pixel 10 × 2");
        await expect(page.getByTestId("checkout-total")).toHaveText("NT$49,980");

        // 預填示範資料；付款方式只有信用卡且已選取
        await expect(page.getByLabel("收件人")).toHaveValue("王小明");
        await expect(page.getByLabel("收件地址")).toHaveValue("臺北市信義區示範路 100 號 5 樓");
        await expect(page.getByLabel("信用卡號碼")).toHaveValue("4242 4242 4242 4242");
        await expect(page.getByRole("radio")).toHaveCount(1);
        await expect(page.getByRole("radio", { name: "信用卡" })).toBeChecked();

        await page.getByRole("button", { name: /確認付款/ }).click();

        // 訂單完成頁
        await expect(page).toHaveURL(/\/checkout\/complete\/MW\d{8}-[A-Z2-9]{6}$/);
        await expect(page.getByRole("heading", { name: "訂單已成立，付款完成" })).toBeVisible();
        await expect(page.getByTestId("order-no")).toHaveText(/^MW\d{8}-[A-Z2-9]{6}$/);
        await expect(page.getByTestId("order-detail")).toContainText("Google Pixel 10 × 2");
        await expect(page.getByTestId("order-total")).toHaveText("NT$49,980");
        await expect(page.getByTestId("order-payment")).toHaveText("信用卡 VISA **** 4242");
        await expect(page.getByTestId("order-detail")).toContainText("王小明（0912-345-678）");

        // 購物車已清空
        await expect(page.getByTestId("cart-count")).toHaveText("0");
        await page.goto("/cart");
        await expect(page.getByText("購物車是空的。")).toBeVisible();
    });

    test("輸入非測試卡號時顯示錯誤，不會成立訂單", async ({ page }, objTestInfo) => {
        await goToCheckoutWithItem(page, `checkout-bad-${objTestInfo.project.name}`);

        await page.getByLabel("信用卡號碼").fill("4111 1111 1111 1112");
        await page.getByLabel("收件地址").fill("台北");
        await page.getByRole("button", { name: /確認付款/ }).click();

        // 頁面另有 Next 的路由播報元素也是 role="alert"，以文字指定
        await expect(page.getByRole("alert").filter({ hasText: "請修正標示的欄位" })).toBeVisible();
        await expect(page.getByText("示範網站只接受測試卡號，請勿輸入真實信用卡")).toBeVisible();
        await expect(page.getByText("請輸入完整收件地址（5–200 字）")).toBeVisible();
        await expect(page).toHaveURL(/\/checkout$/);
        await expect(page.getByTestId("cart-count")).toHaveText("2");

        // 送出後保留使用者輸入的地址；卡號還原為預填的測試卡號
        await expect(page.getByLabel("收件地址")).toHaveValue("台北");
        await expect(page.getByLabel("信用卡號碼")).toHaveValue("4242 4242 4242 4242");
    });

    test("看不到不存在或別人的訂單", async ({ page }, objTestInfo) => {
        await signUp(page, createTestEmail(`checkout-404-${objTestInfo.project.name}`));
        await expect(page).toHaveURL(/\/$/);

        const objResponse = await page.goto("/checkout/complete/MW20260101-AAAAAA");
        expect(objResponse?.status()).toBe(404);
    });
});
