import { expect, test } from "@playwright/test";
import { createTestEmail, signUp } from "./auth-helpers";

// User Story：註冊會員在手機詳細頁選擇數量加入購物車，頁首圖示顯示購物車件數，
// 並可在購物車頁修改數量、移除商品；未登入的訪客無法購物
// 測試帳號（e2e-*@example.com）與其購物車由 e2e/global-teardown.ts 於測試結束後清除

test.describe("購物車（未登入）", () => {
    test("頁首顯示購物車圖示，件數為 0", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByTestId("cart-icon")).toBeVisible();
        await expect(page.getByTestId("cart-count")).toHaveText("0");
    });

    test("手機頁只顯示「登入後購買」，登入後回到同一支手機", async ({ page }) => {
        await page.goto("/phones/pixel-10");
        const locBox = page.getByTestId("add-to-cart");
        await expect(locBox.getByRole("link", { name: "登入後購買" })).toHaveAttribute(
            "href",
            "/auth/sign-in?redirectTo=%2Fphones%2Fpixel-10",
        );
        await expect(locBox.getByRole("button", { name: "加入購物車" })).toHaveCount(0);
    });

    test("未登入進入購物車頁會被導向登入頁", async ({ page }) => {
        await page.goto("/cart");
        await expect(page).toHaveURL(/\/auth\/sign-in/);
    });
});

test.describe("購物車（已登入）", () => {
    test("選數量加入購物車 → 頁首件數更新 → 購物車頁修改數量與移除", async ({ page }, objTestInfo) => {
        await signUp(page, createTestEmail(`cart-${objTestInfo.project.name}`));
        await expect(page).toHaveURL(/\/$/);
        await expect(page.getByTestId("cart-count")).toHaveText("0");

        // 手機頁：數量調成 2 後加入
        await page.goto("/phones/iphone-17-pro-max");
        const locBox = page.getByTestId("add-to-cart");
        await locBox.getByRole("button", { name: "增加數量" }).click();
        await expect(locBox.getByLabel("購買數量")).toHaveValue("2");
        await locBox.getByRole("button", { name: "加入購物車" }).click();
        await expect(locBox.getByRole("status")).toContainText("已將 2 件「iPhone 17 Pro Max」加入購物車");
        await expect(page.getByTestId("cart-count")).toHaveText("2");

        // 另一支手機直接輸入數量 3
        await page.goto("/phones/pixel-10");
        await page.getByTestId("add-to-cart").getByLabel("購買數量").fill("3");
        await page.getByTestId("add-to-cart").getByRole("button", { name: "加入購物車" }).click();
        await expect(page.getByTestId("cart-count")).toHaveText("5");

        // 同一支手機再加 1：累加數量
        await page.getByTestId("add-to-cart").getByLabel("購買數量").fill("1");
        await page.getByTestId("add-to-cart").getByRole("button", { name: "加入購物車" }).click();
        await expect(page.getByTestId("cart-count")).toHaveText("6");

        // 購物車頁：兩項商品、6 件、總金額正確
        await page.getByTestId("cart-icon").click();
        await expect(page).toHaveURL(/\/cart$/);
        await expect(page.getByTestId("cart-line")).toHaveCount(2);
        await expect(page.getByTestId("cart-total-count")).toHaveText("6");
        await expect(page.getByTestId("cart-total-price")).toHaveText("NT$186,940"); // 43,490 × 2 + 24,990 × 4

        // 修改數量：iPhone 減為 1
        const locIphone = page.getByTestId("cart-line").filter({ hasText: "iPhone 17 Pro Max" });
        await locIphone.getByRole("button", { name: "減少數量" }).click();
        await expect(page.getByTestId("cart-count")).toHaveText("5");
        await expect(page.getByTestId("cart-total-price")).toHaveText("NT$143,450");

        // 移除 Pixel：剩 1 件
        await page.getByTestId("cart-line").filter({ hasText: "Pixel 10" }).getByRole("button", { name: "移除" }).click();
        await expect(page.getByTestId("cart-line")).toHaveCount(1);
        await expect(page.getByTestId("cart-count")).toHaveText("1");
        await expect(page.getByTestId("cart-total-price")).toHaveText("NT$43,490");

        // 重新整理後件數仍在（存在資料庫）
        await page.reload();
        await expect(page.getByTestId("cart-count")).toHaveText("1");
    });
});
