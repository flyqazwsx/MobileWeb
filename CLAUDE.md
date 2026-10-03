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
- E2E 跑未知網址時伺服器會印出 `Error: Internal: NoFallbackError`，這是 `dynamicParams = false` 回 404 的正常紀錄，不是失敗。

# 架構

Next.js 16（App Router、Turbopack、React 19、Tailwind CSS v4、TypeScript）。所有頁面都是 Server Component，在 build 時以 `generateStaticParams` 靜態產生。

- **資料流**：`src/data/*.ts`（示範資料）→ `src/lib/phone-repository.ts`（唯一資料入口，全部 `async`）→ `src/app/**/page.tsx`。頁面與元件**不得**直接 import `src/data`；改接 Neon 時只替換 repository 的實作，函式簽章不變。型別契約在 `src/lib/types.ts`。
- **路由**：`/`（熱門 TOP 20，依 `hotRank` 排序）、`/brands/[brand]`、`/phones/[slug]`。兩個動態路由都設 `dynamicParams = false`，未列在 `generateStaticParams` 的代碼一律 404（`src/app/not-found.tsx`）。新增品牌或手機只要加資料，頁面自動產生。
- **Next 16 注意事項**：`params` 是 Promise，必須 `await`；頁面屬性型別用全域的 `PageProps<"/phones/[slug]">`（由 `next typegen` 產生）。
- **圖片**：資料尚無圖片（`imageUrl: null`），`PhoneImage` 以品牌色繪製 SVG 佔位圖。日後放外部圖片需在 `next.config.ts` 設定 `images.remotePatterns`（`images.domains` 已棄用）。
- **評測**：`src/lib/review-links.ts` 目前依手機名稱產生 YouTube/Facebook/Instagram 搜尋連結，尚未收錄實際影片。
- **熱門月份**：首頁標題用 `new Date()` 計算，因頁面為靜態產生，顯示的是 build 當下的月份。

# 目前狀態與待辦

- 規格與價格是**示範資料**（依公開資訊整理，未與手機王、傑昇通信逐筆核對）；`src/data/data-integrity.test.ts` 定義資料必須滿足的規則（代碼唯一、品牌對應、排名不重複、售價 ≤ 建議售價等），日後資料匯入也要通過。
- 尚未完成：Neon 資料庫與匯入流程、實際產品圖片、評測影片收錄、Vercel 部署。

# 程式碼慣例

依全域 CLAUDE.md 的 YUL 編碼規範：4 空白縮排、UTF-8、CRLF（`.editorconfig`、`.gitattributes`）、中文註解、JSDoc、檔頭註解 + Change Log。命名的套用方式：

- 變數加型別前綴（`strSlug`、`arrPhones`、`objBrand`），函式參數加 `_` 前綴（`_strBrandSlug`），原生型別常數用全大寫蛇形（`INT_HOT_PHONE_LIMIT`）。
- React 元件用帕斯卡命名，props 以單一參數 `_objProps` 接收（不解構），以符合參數命名規則。
- 資料物件的屬性（`Phone.slug`、`specs.ramGb`）維持 camelCase、不加前綴，對應將來資料庫欄位映射。
- 前端檔名用連字號命名（`phone-card.tsx`）；Next.js 規定的檔名（`page.tsx`、`layout.tsx`、`[slug]`）維持原樣。
