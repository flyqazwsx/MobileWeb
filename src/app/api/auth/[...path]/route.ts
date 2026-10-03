/*
MobileWeb Auth API Route
名稱：會員驗證 API
說明：將 /api/auth/* 的請求交給 Neon Auth 處理（註冊、登入、登出、取得登入狀態等）

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／會員註冊登入]
*/

import { auth } from "@/lib/auth/server";

export const { GET, POST } = auth.handler();
