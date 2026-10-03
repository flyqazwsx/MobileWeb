/*
MobileWeb Brand Seed Data
名稱：品牌示範資料
說明：上方選單使用的品牌清單（顯示順序即陣列順序）

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／基本原型]
*/

import type { Brand } from "@/lib/types";

export const arrBrandData: Brand[] = [
    { slug: "apple", name: "Apple", color: "#1d1d1f" },
    { slug: "samsung", name: "Samsung", color: "#1428a0" },
    { slug: "google", name: "Google", color: "#4285f4" },
    { slug: "sony", name: "Sony", color: "#2b2b2b" },
    { slug: "asus", name: "ASUS", color: "#00539b" },
    { slug: "xiaomi", name: "Xiaomi", color: "#ff6900" },
    { slug: "oppo", name: "OPPO", color: "#1a7f5a" },
    { slug: "vivo", name: "vivo", color: "#415fff" },
    { slug: "motorola", name: "Motorola", color: "#5c2d91" },
    { slug: "nothing", name: "Nothing", color: "#d71921" },
];
