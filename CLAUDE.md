# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

# 網站大綱

## 首頁

建立一個手機電商的瀏覽網站，這個網站提供了全台灣市面上所有手機的產品資料，包括但不限於：

- 圖片
- 產品名稱
- 規格參數，大小、重量、CPU、記憶體、儲存、解析度、相機詳細功能
- 官方建議售價
- 本站售價

這個網站的首頁會列出這個月最紅的手機前 20 名，然後點擊後會進入手機詳細說明頁。
上面的選單是不同品牌的手機，點入後，該頁的內容會列出該品牌的所有手機，並且可以點擊手機進入手機詳細說明頁。

## 手機詳細說明頁

手機詳細說明頁會列出該手機的各項規格參數，包括但不限於：

- 圖片
- 產品名稱
- 規格參數，大小、重量、CPU、記憶體、儲存、解析度、相機詳細功能
- 官方建議售價
- 本站售價
- 網路上的評測（Youtube、FB、IG 等相關的評測影片）

# 技術堆疊

- 這個網站最後要部署到 Vercel + Neon，因此需要使用者在這兩個雲端供應商有帳號，如果需要取得 Access Token 也放在 `.env.local` 並且幫忙部署
- 資料庫使用 Vercel Marketplace 提供的 Neon（資源名稱 `mobile-web-db`，區域 Singapore `sin1`，已連到 Vercel 專案 `mobile-web`）；環境變數前綴 `DATABASE`（`DATABASE_URL`、`DATABASE_URL_UNPOOLED`），本機以 `npx vercel env pull .env.local` 取得
- Vercel Functions 區域固定為 `sin1`（`vercel.json`），與資料庫同區
- 使用 Next.js 的所有需要堆疊
- 將這個網站儲存在 GitHub 上，是 Public Repo，名稱為 MobileWeb（https://github.com/flyqazwsx/MobileWeb）

# 資料來源

所有資料來源可以參考台灣最流行的手機網站，下面兩個：

- 手機王：https://www.sogi.com.tw/
- 傑昇通信：https://www.jyes.com.tw/

# 常用指令

| 用途 | 指令 |
|------|------|
| 開發伺服器（http://localhost:3000） | `npm run dev` |
| 正式建置／啟動 | `npm run build` / `npm start` |
| Lint（ESLint flat config；Next 16 已移除 `next lint`） | `npm run lint` |
| 型別檢查（先產生 `PageProps`/`LayoutProps` 路由型別） | `npm run typecheck` |
| 單元測試（Vitest） | `npm test` |
| 單一測試檔／單一案例 | `npx vitest run src/lib/format.test.ts` / `npx vitest run -t "formatPrice"` |
| 覆蓋率（門檻 90%，範圍 `src/lib`、`src/data`） | `npm run test:coverage` |
| E2E（Playwright，desktop + mobile 兩個 project） | `npm run test:e2e` |
| 單一 E2E 案例 | `npx playwright test -g "品牌選單" --project=desktop` |

- E2E 的 `webServer` 會先 `npm run build` 再以 `next start -p 3100` 啟動；本機若 3100 已有服務會直接沿用（`reuseExistingServer`），改完程式碼要確認不是在測舊的 build。
- E2E 結束時 `e2e/global-teardown.ts` 會以 SQL 刪除 `e2e-*@example.com` 測試帳號（讀 `.env.local` 的 `DATABASE_URL`）。
- 頁面 `revalidate = 3600` 會讓 Neon 查詢結果進 `.next/cache/fetch-cache`；`db:seed` 後一小時內重新 build 仍可能拿到舊資料，要立即生效就先刪掉這個資料夾。
- E2E 跑未知網址時伺服器會印出 `Error: Internal: NoFallbackError`，這是 `dynamicParams = false` 回 404 的正常紀錄，不是失敗。

# 架構

Next.js 16（App Router、Turbopack、React 19、Tailwind CSS v4、TypeScript）。所有頁面都是 Server Component，在 build 時以 `generateStaticParams` 靜態產生。

- **資料流**：Neon（`TBL_BRAND`／`TBL_PHONE`／`TBL_PHONE_CAMERA`）→ `src/lib/phone-repository.ts`（唯一資料入口，全部 `async`，以 React `cache` 包裝）→ `src/app/**/page.tsx`。頁面與元件**不得**直接 import `src/data`；`src/data/*.ts` 只是 `npm run db:seed` 的匯入來源。型別契約在 `src/lib/types.ts`。
- **路由**：`/`（熱門 TOP 20，依 `hotRank` 排序）、`/brands/[brand]`、`/phones/[slug]`。兩個動態路由都設 `dynamicParams = false`，未列在 `generateStaticParams` 的代碼一律 404（`src/app/not-found.tsx`）。新增品牌或手機只要加資料，頁面自動產生。
- **Next 16 注意事項**：`params` 是 Promise，必須 `await`；頁面屬性型別用全域的 `PageProps<"/phones/[slug]">`（由 `next typegen` 產生）。
- **圖片**：產品圖放 `public/images/phones/{slug}.jpg`（640×480，取自手機王），`imageUrl` 為 `null` 時 `PhoneImage` 以品牌色繪製 4:3 佔位圖。改用外部圖片網址需在 `next.config.ts` 設定 `images.remotePatterns`（`images.domains` 已棄用）。
- **會員**：Neon Auth（Managed Better Auth，`@neondatabase/auth` + `@neondatabase/auth-ui`，beta）。伺服器實例 `src/lib/auth/server.ts`、API `src/app/api/auth/[...path]`、路由保護 `src/proxy.ts`（只攔 `/account/*`）、頁面 `src/app/auth/[path]` 與 `src/app/account/[path]`。`AuthProvider` 包在根版面，頁首 `UserMenu` 在瀏覽器端取得登入狀態，因此商品頁仍為靜態。會員資料在 `neon_auth` schema。
  - Auth URL 由整合注入為 `DATABASE_NEON_AUTH_BASE_URL`（有前綴，不是文件寫的 `NEON_AUTH_BASE_URL`）；`NEON_AUTH_COOKIE_SECRET` 另以 `vercel env add` 設定。
  - UI 字串在 `localization-zh-tw.ts`；Neon client 的錯誤代碼位置與 better-auth-ui 預期不同，錯誤 toast 由 `translate-auth-message.ts` 以英文訊息反查中文，伺服器新出現的英文訊息要補進對照表。
  - Neon 代管版沒有 `delete-user` API（回 404），所以不提供刪除帳號。
- **購物車**：`TBL_CART_ITEM`（PK 會員 + 手機，數量 1–99）。`USER_ID` 外鍵到 `neon_auth."user"(id)` ON DELETE CASCADE；`PHONE_SLUG` 外鍵為 `DEFERRABLE INITIALLY DEFERRED`，讓 `db:seed` 在同一交易內刪除再重建手機資料不被擋（真的移除某支手機時 seed 會在 commit 失敗，需先清購物車）。規則在 `src/lib/cart.ts`、資料存取在 `src/lib/cart-repository.ts`、Server Actions 在 `src/app/cart/actions.ts`（一律以伺服器端 session 取會員 ID）。頁首件數由 `CartProvider`（瀏覽器端 context，件數連同會員 ID 保存）供 `CartIcon` 與 `AddToCart` 共用；`/cart` 為 `force-dynamic` 並由 proxy 保護。
- **評測**：`src/lib/review-links.ts` 目前依手機名稱產生 YouTube/Facebook/Instagram 搜尋連結，尚未收錄實際影片。
- **熱門月份**：首頁標題用 `new Date()` 計算，因頁面為靜態產生，顯示的是 build 當下的月份。

# 目前狀態與待辦

- 規格與價格是**示範資料**（依公開資訊整理，未與手機王、傑昇通信逐筆核對）；`src/data/data-integrity.test.ts` 定義資料必須滿足的規則（代碼唯一、品牌對應、排名不重複、售價 ≤ 建議售價等），日後資料匯入也要通過。
- 已完成：Neon 資料庫、Vercel 部署（push `main` 自動部署）、產品圖（Nothing Phone (3a) Pro 手機王未收錄，仍為佔位圖）、會員註冊登入（Email + 密碼）、購物車。
- 尚未完成：正式資料爬取（手機王、傑昇通信）、評測影片收錄、結帳／訂單／付款。

# 程式碼慣例

依全域 CLAUDE.md 的 YUL 編碼規範：4 空白縮排、UTF-8、CRLF（`.editorconfig`、`.gitattributes`）、中文註解、JSDoc、檔頭註解 + Change Log。命名的套用方式：

- 變數加型別前綴（`strSlug`、`arrPhones`、`objBrand`），函式參數加 `_` 前綴（`_strBrandSlug`），原生型別常數用全大寫蛇形（`INT_HOT_PHONE_LIMIT`）。
- React 元件用帕斯卡命名，props 以單一參數 `_objProps` 接收（不解構），以符合參數命名規則。
- 資料物件的屬性（`Phone.slug`、`specs.ramGb`）維持 camelCase、不加前綴，對應將來資料庫欄位映射。
- 前端檔名用連字號命名（`phone-card.tsx`）；Next.js 規定的檔名（`page.tsx`、`layout.tsx`、`[slug]`）維持原樣。
