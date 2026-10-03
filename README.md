# MobileWeb

全台灣市售手機的瀏覽網站：每月熱門手機排行、依品牌瀏覽，以及包含規格參數、官方建議售價、本站售價與網路評測的手機詳細說明頁。

> ⚠️ 目前為**基本原型**，手機規格與價格是示範資料，尚未與手機王、傑昇通信逐筆核對。

## 功能

- **首頁**：本月熱門手機 TOP 20，點擊進入詳細說明頁
- **品牌選單**：Apple、Samsung、Google、Sony、ASUS、Xiaomi、OPPO、vivo、Motorola、Nothing，列出該品牌所有手機
- **手機詳細說明頁**：圖片、尺寸、重量、處理器、記憶體、儲存、螢幕與解析度、相機詳細規格、錄影、電池、官方建議售價／本站售價／折扣，以及 YouTube、Facebook、Instagram 評測連結

## 技術堆疊

- Next.js 16（App Router、Turbopack）、React 19、TypeScript
- Tailwind CSS v4
- 測試：Vitest（單元測試與覆蓋率）、Playwright（E2E，桌機與手機兩種裝置）
- 預計部署：Vercel + Neon（Postgres）

## 環境需求

- Node.js 20.9 以上（開發環境為 Node.js 24）
- npm

## 安裝與執行

```bash
npm install
npm run dev
```

開啟 http://localhost:3000

## 測試

```bash
npm run lint            # ESLint
npm run typecheck       # TypeScript 型別檢查
npm test                # 單元測試
npm run test:coverage   # 單元測試覆蓋率（門檻 90%）
npm run test:e2e        # E2E 測試（首次執行需先 npx playwright install chromium）
```

## 專案結構

```
src/
  app/            頁面（首頁、brands/[brand]、phones/[slug]、404）
  components/     頁首、手機卡片、手機圖片
  data/           示範資料（品牌、手機）
  lib/            型別、資料存取層、格式化、評測連結
e2e/              Playwright E2E 測試
```

## 資料來源

- 手機王：https://www.sogi.com.tw/
- 傑昇通信：https://www.jyes.com.tw/

## 授權

尚未指定。
