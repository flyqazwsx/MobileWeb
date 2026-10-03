# MobileWeb

台灣手機產品瀏覽網站：首頁列出本月熱門手機前 20 名，上方選單依品牌瀏覽，點擊進入手機詳細說明頁（規格、相機、官方建議售價、本站售價、網路評測連結）。訪客可註冊會員（Email + 密碼），登入後進入會員專區管理帳號，並可在手機頁選擇數量加入購物車（頁首顯示購物車件數），於購物車結帳。

正式網址：<https://mobile-web-self.vercel.app>（推送到 `main` 自動部署；其他分支產生預覽網址）

## 技術堆疊

| 項目 | 使用 |
|------|------|
| 框架 | Next.js 16（App Router）、React 19、TypeScript、Tailwind CSS 4 |
| 資料庫 | Neon（PostgreSQL），透過 Vercel Marketplace 建立，區域 Singapore（`aws-ap-southeast-1`） |
| 資料庫驅動 | `@neondatabase/serverless`（HTTP 模式） |
| 會員 | Neon Auth（Managed Better Auth）：`@neondatabase/auth`、`@neondatabase/auth-ui`（目前為 beta 版） |
| 部署 | Vercel，Functions 區域 `sin1`（見 `vercel.json`，與資料庫同區） |
| 測試 | Vitest（單元／整合測試）、Playwright（E2E，桌機與手機兩種裝置） |

## 專案結構

```
db/migrations/        資料表建立 SQL（可重複執行）
scripts/              資料庫維運腳本（建表、匯入示範資料）
src/app/              頁面（首頁、品牌頁、手機詳細說明頁、會員 auth/ 與 account/、購物車 cart/、結帳 checkout/、API api/auth/）
src/components/       共用元件
src/data/             示範資料（匯入資料庫的來源）
src/lib/              資料存取層、資料列轉換、格式化工具
src/lib/auth/         會員驗證（伺服器／瀏覽器端實例、繁體中文字串、錯誤訊息翻譯）
src/proxy.ts          路由保護：未登入進入 /account、/cart、/checkout 導向登入頁
public/images/phones/ 手機產品圖（{代碼}.jpg）
e2e/                  Playwright E2E 測試
```

## 環境變數

由 Vercel 的 Neon 整合自動產生（Custom Prefix：`DATABASE`），本機以 Vercel CLI 拉取，**不要手動填寫或提交到版控**：

| 變數 | 用途 |
|------|------|
| `DATABASE_URL` | 網站查詢用（經連線池） |
| `DATABASE_URL_UNPOOLED` | 建表、匯入等維運腳本用（直連） |
| `DATABASE_NEON_AUTH_BASE_URL` | 會員驗證服務網址（在 Neon 開啟 Auth 後由整合注入） |
| `NEON_AUTH_COOKIE_SECRET` | 會員登入 cookie 的加密金鑰（至少 32 字元，非整合產生，需另外以 `vercel env add` 設定於三個環境） |

## 本機開發

```bash
npm install

# 第一次：登入 Vercel、連結專案、拉取環境變數到 .env.local
npx vercel login
npx vercel link --project mobile-web
npx vercel env pull .env.local

# 建立資料表並匯入示範資料（會覆蓋資料庫現有內容）
npm run db:migrate
npm run db:seed

npm run dev
```

開啟 <http://localhost:3000>。

## 常用指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 開發伺服器 |
| `npm run build` | 正式建置（會連資料庫產生頁面） |
| `npm run db:migrate` | 建立資料表 |
| `npm run db:seed` | 以 `src/data` 示範資料覆蓋資料庫 |
| `npm test` | 單元與整合測試（未設定 `DATABASE_URL` 時略過資料庫整合測試） |
| `npm run test:coverage` | 測試並產生覆蓋率報告（門檻 90%） |
| `npm run test:e2e` | 建置後啟動網站並執行 E2E 測試 |
| `npm run lint` / `npm run typecheck` | 程式碼檢查 / 型別檢查 |

## 會員功能

| 網址 | 說明 |
|------|------|
| `/auth/sign-up`、`/auth/sign-in` | 註冊、登入（另有忘記密碼、重設密碼等頁面） |
| `/account/settings`、`/account/security` | 會員專區：名稱、電子郵件、變更密碼、登入裝置；未登入會導向登入頁 |

- 會員資料存在同一個 Neon 資料庫的 `neon_auth` schema（`neon_auth."user"` 等），由 Neon 代管。
- 首頁、品牌頁、手機頁仍為靜態產生；頁首的會員選單在瀏覽器端取得登入狀態。
- **信任網域**：Neon Console → Settings → Auth → Domains 必須列出網站網址，否則註冊、登入會回 `Invalid origin`（localhost 預設允許）。目前已加入正式站 `https://mobile-web-self.vercel.app` 與分支預覽網址；新分支或自訂網域要另外加。
- 不提供刪除帳號：Neon 代管的 Better Auth 沒有 `delete-user` API。
- E2E 註冊的測試帳號一律用 `e2e-*@example.com`，測試結束後由 `e2e/global-teardown.ts` 以 SQL 刪除。

## 購物車

- 只有登入會員能購物；未登入時手機頁顯示「登入後購買」，登入後回到同一支手機頁。
- 手機頁選擇數量（1–99）加入購物車，同一支手機重複加入時數量累加（上限 99）。
- 頁首購物車圖示顯示總件數（數量加總），點擊進入 `/cart`：可修改數量、移除，並顯示總金額（以目前本站售價計算）。
- 資料存在 `TBL_CART_ITEM`（`db/migrations/002-create-cart-table.sql`），換裝置登入也看得到；會員被刪除時購物車一併刪除。
- 讀寫一律經 `src/app/cart/actions.ts`（Server Actions），在伺服器端以 session 取得會員 ID，不信任用戶端傳來的身分。
- 尚未提供：選擇容量或顏色。

## 結帳

- 購物車按「結帳」進入 `/checkout`：左側收件資訊與付款方式（目前只有信用卡），右側訂單資訊。
- 欄位預填**示範資料**（虛構收件人與公開測試卡號 `4242 4242 4242 4242`），直接按「確認付款」即完成；完成後導向 `/checkout/complete/{訂單編號}`。
- 尚未串接金流：只接受測試卡號（VISA 4242…、MASTERCARD 5555 5555 5555 4444、JCB 3566 0020 2036 0505），其他卡號一律拒絕；完整卡號、有效期限、安全碼不寫入資料庫，訂單只存卡別與末四碼。
- 建立訂單、寫入明細、清空購物車在同一個交易內完成；明細保存下單當下的品名與單價。
- 資料表：`TBL_ORDER`、`TBL_ORDER_ITEM`（`db/migrations/003-create-order-tables.sql`）。

## 資料更新

頁面採 ISR，每小時重新產生一次；資料庫新增的品牌或手機，第一次造訪時即會產生頁面，不需重新部署。

資料庫查詢結果會進 Next 的 fetch 快取（與 ISR 同為 1 小時）。執行 `db:seed` 後一小時內本機重新建置仍可能拿到舊資料，需要立即生效時把 `.next/cache/fetch-cache` 刪掉再建置。

## 資料來源

目前為示範資料，規格與價格尚未逐筆核對。正式資料將參考：

- 手機王：<https://www.sogi.com.tw/>
- 傑昇通信：<https://www.jyes.com.tw/>

產品圖取自手機王產品頁（640×480），存放於 `public/images/phones/`；正式營運前建議換成品牌官方新聞圖。
