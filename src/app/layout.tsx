/*
MobileWeb Root Layout
名稱：根版面
說明：所有頁面共用的頁首（品牌選單）與頁尾（資料來源聲明）

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／基本原型]
*/

import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
    title: {
        default: "MobileWeb｜全台手機規格與價格",
        template: "%s｜MobileWeb",
    },
    description: "全台灣市售手機的規格參數、官方建議售價與本站售價，以及每月熱門手機排行。",
};

/**
 * 根版面
 * @param {LayoutProps<"/">} _objProps 版面屬性
 * @returns {JSX.Element} 頁面骨架
 */
export default function RootLayout(_objProps: LayoutProps<"/">) {
    return (
        <html lang="zh-Hant-TW" className="h-full antialiased">
            <body className="flex min-h-full flex-col font-sans">
                <SiteHeader />
                <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{_objProps.children}</main>
                <footer className="border-t border-slate-200 bg-white">
                    <div className="mx-auto max-w-6xl px-4 py-4 text-xs leading-relaxed text-slate-500">
                        <p>
                            ⚠️ 原型階段：本站規格與價格為示範資料，尚未與
                            <a href="https://www.sogi.com.tw/" className="mx-1 underline" target="_blank" rel="noreferrer">
                                手機王
                            </a>
                            、
                            <a href="https://www.jyes.com.tw/" className="mx-1 underline" target="_blank" rel="noreferrer">
                                傑昇通信
                            </a>
                            逐筆核對，實際以各通路公告為準。
                        </p>
                    </div>
                </footer>
            </body>
        </html>
    );
}
