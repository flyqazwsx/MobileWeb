/*
MobileWeb Proxy
名稱：路由保護
說明：Next.js 16 的 proxy（原 middleware）。未登入時進入會員專區（/account）、購物車（/cart）、結帳（/checkout）與訂單管理（/orders）一律導向登入頁；
      其他頁面（首頁、品牌、手機）不經過 proxy，維持靜態產生

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／會員註冊登入]
[2026-10-04] [flyqazwsx] [購物車頁 /cart 也需登入]
[2026-10-04] [flyqazwsx] [結帳頁 /checkout 也需登入]
[2026-10-04] [flyqazwsx] [訂單管理 /orders 也需登入]
*/

import { auth } from "@/lib/auth/server";

export default auth.middleware({ loginUrl: "/auth/sign-in" });

export const config = {
    matcher: ["/account/:path*", "/cart", "/checkout/:path*", "/orders/:path*"],
};
