/*
MobileWeb Account Index
名稱：會員專區入口
說明：/account 直接導向帳號設定頁

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／會員註冊登入]
*/

import { redirect } from "next/navigation";

/**
 * 會員專區入口
 * @returns {never} 導向帳號設定頁
 */
export default function AccountIndexPage() {
    redirect("/account/settings");
}
