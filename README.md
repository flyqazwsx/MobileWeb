# MobileWeb

台灣手機產品瀏覽網站：首頁列出本月熱門手機前 20 名，上方選單依品牌瀏覽，點擊進入手機詳細說明頁（規格、相機、官方建議售價、本站售價、網路評測連結）。

正式網址：<https://mobile-web-self.vercel.app>（推送到 `main` 自動部署；其他分支產生預覽網址）

## 技術堆疊

| 項目 | 使用 |
|------|------|
| 框架 | Next.js 16（App Router）、React 19、TypeScript、Tailwind CSS 4 |
| 資料庫 | Neon（PostgreSQL），透過 Vercel Marketplace 建立，區域 Singapore（`aws-ap-southeast-1`） |
| 資料庫驅動 | `@neondatabase/serverless`（HTTP 模式） |
| 部署 | Vercel，Functions 區域 `sin1`（見 `vercel.json`，與資料庫同區） |
| 測試 | Vitest（單元／整合測試）、Playwright（E2E，桌機與手機兩種裝置） |

## 專案結構

```
db/migrations/        資料表建立 SQL（可重複執行）
scripts/              資料庫維運腳本（建表、匯入示範資料）
src/app/              頁面（首頁、品牌頁、手機詳細說明頁）
src/components/       共用元件
src/data/             示範資料（匯入資料庫的來源）
src/lib/              資料存取層、資料列轉換、格式化工具
e2e/                  Playwright E2E 測試
```

## 環境變數

由 Vercel 的 Neon 整合自動產生（Custom Prefix：`DATABASE`），本機以 Vercel CLI 拉取，**不要手動填寫或提交到版控**：

| 變數 | 用途 |
|------|------|
| `DATABASE_URL` | 網站查詢用（經連線池） |
| `DATABASE_URL_UNPOOLED` | 建表、匯入等維運腳本用（直連） |

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

## 資料更新

頁面採 ISR，每小時重新產生一次；資料庫新增的品牌或手機，第一次造訪時即會產生頁面，不需重新部署。

## 資料來源

目前為示範資料，規格與價格尚未逐筆核對。正式資料將參考：

- 手機王：<https://www.sogi.com.tw/>
- 傑昇通信：<https://www.jyes.com.tw/>
