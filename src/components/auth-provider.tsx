/*
MobileWeb Auth Provider
名稱：會員介面 Provider
說明：包裝 NeonAuthUIProvider，設定 Next.js 導頁、繁體中文字串與本站啟用的功能
      （只開 Email + 密碼；不顯示第三方登入）。
      不開放刪除帳號：Neon 代管的 Better Auth 沒有 delete-user API（實測回 404）

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／會員註冊登入]
[2026-10-04] [flyqazwsx] [錯誤訊息 toast 改顯示繁體中文]
*/

"use client";

import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { objZhTwLocalization } from "@/lib/auth/localization-zh-tw";
import { translateAuthMessage } from "@/lib/auth/translate-auth-message";

interface AuthProviderProps {
    children: ReactNode;
    className?: string;
}

/** toast 樣式（對應 sonner 的函式） */
type ToastVariant = "default" | "success" | "error" | "info" | "warning";

/**
 * 顯示會員功能的提示訊息（先把伺服器的英文訊息翻成繁體中文）
 * @param {{ variant?: ToastVariant; message?: string }} _objToast 提示內容
 * @returns {void}
 */
function showAuthToast(_objToast: { variant?: ToastVariant; message?: string }): void {
    const strMessage = translateAuthMessage(_objToast.message) ?? "";
    const strVariant = _objToast.variant ?? "default";

    if (strVariant === "default") {
        toast(strMessage);
        return;
    }

    toast[strVariant](strMessage);
}

/**
 * 會員介面 Provider
 * @param {AuthProviderProps} _objProps 元件屬性
 * @returns {JSX.Element} 包上會員功能的子元件
 */
export default function AuthProvider(_objProps: AuthProviderProps) {
    const objRouter = useRouter();

    return (
        <NeonAuthUIProvider
            authClient={authClient}
            className={_objProps.className}
            defaultTheme="light"
            localization={objZhTwLocalization}
            navigate={objRouter.push}
            replace={objRouter.replace}
            onSessionChange={() => objRouter.refresh()}
            Link={Link}
            // [2026-10-04] [Neon client 的錯誤代碼位置與套件預期不同，改在 toast 層翻譯]
            toast={showAuthToast}
            redirectTo="/"
            emailOTP={false}
            magicLink={false}
            passkey={false}
        >
            {_objProps.children}
        </NeonAuthUIProvider>
    );
}
