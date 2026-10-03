/*
MobileWeb Auth Client
名稱：會員驗證（瀏覽器端）
說明：瀏覽器端的 Neon Auth client，透過本站 /api/auth 路由與伺服器溝通

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／會員註冊登入]
*/

"use client";

import { createAuthClient } from "@neondatabase/auth/next";

/** Neon Auth 瀏覽器端 client */
export const authClient = createAuthClient();
