import { expect, test } from "@playwright/test";

// User Story：訪客從首頁熱門排行、品牌選單瀏覽手機，並查看詳細規格、價格與評測

test.describe("首頁熱門排行", () => {
    test("顯示 20 支熱門手機，排名 1–20 依序排列", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByRole("heading", { level: 1 })).toContainText("熱門手機 TOP 20");

        const locCards = page.getByTestId("phone-card");
        await expect(locCards).toHaveCount(20);

        const arrRanks = await page.getByTestId("hot-rank").allTextContents();
        expect(arrRanks).toEqual(Array.from({ length: 20 }, (_, _intIndex) => String(_intIndex + 1)));
    });

    test("點擊第一名進入詳細說明頁", async ({ page }) => {
        await page.goto("/");
        await page.getByTestId("phone-card").first().click();

        await expect(page).toHaveURL(/\/phones\/iphone-17-pro-max$/);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText("iPhone 17 Pro Max");
    });
});

test.describe("品牌選單", () => {
    test("點選 Samsung 只列出 Samsung 手機", async ({ page }) => {
        await page.goto("/");
        await page.getByRole("navigation", { name: "品牌選單" }).getByRole("link", { name: "Samsung" }).click();

        await expect(page).toHaveURL(/\/brands\/samsung$/);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText("Samsung 手機");

        const arrNames = await page.getByTestId("phone-card").locator("h3").allTextContents();
        expect(arrNames.length).toBeGreaterThan(0);
        for (const strName of arrNames) {
            expect(strName).toContain("Samsung");
        }
    });

    test("從品牌頁進入手機詳細說明頁", async ({ page }) => {
        await page.goto("/brands/google");
        await page.getByTestId("phone-card").filter({ hasText: "Pixel 10 Pro" }).click();

        await expect(page).toHaveURL(/\/phones\/pixel-10-pro$/);
    });
});

test.describe("手機詳細說明頁", () => {
    test("顯示價格、規格、相機與評測連結", async ({ page }) => {
        await page.goto("/phones/galaxy-s25-ultra");

        await expect(page.getByTestId("msrp")).toHaveText("NT$42,900");
        await expect(page.getByTestId("sale-price")).toContainText("NT$36,990");

        for (const strLabel of ["尺寸", "重量", "處理器", "記憶體", "儲存容量", "解析度"]) {
            await expect(page.getByRole("rowheader", { name: strLabel, exact: true })).toBeVisible();
        }
        await expect(page.getByText("主鏡頭・200MP")).toBeVisible();

        const locReviews = page.getByTestId("review-link");
        await expect(locReviews).toHaveCount(3);
        await expect(locReviews.first()).toHaveAttribute("href", /youtube\.com\/results\?search_query=/);
    });

    test("麵包屑可回到品牌頁", async ({ page }) => {
        await page.goto("/phones/xperia-1-vii");
        await page.getByRole("navigation", { name: "麵包屑" }).getByRole("link", { name: "Sony" }).click();
        await expect(page).toHaveURL(/\/brands\/sony$/);
    });
});

test.describe("找不到頁面", () => {
    test("未知手機與未知品牌回 404", async ({ page }) => {
        const objPhoneResponse = await page.goto("/phones/no-such-phone");
        expect(objPhoneResponse?.status()).toBe(404);
        await expect(page.getByRole("heading", { name: "找不到這個頁面" })).toBeVisible();

        const objBrandResponse = await page.goto("/brands/no-such-brand");
        expect(objBrandResponse?.status()).toBe(404);
    });
});

test("手機寬度不出現水平捲軸", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    for (const strPath of ["/", "/brands/apple", "/phones/iphone-17-pro-max"]) {
        await page.goto(strPath);
        const blnOverflow = await page.evaluate(
            () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        );
        expect(blnOverflow, strPath).toBe(false);
    }
});
