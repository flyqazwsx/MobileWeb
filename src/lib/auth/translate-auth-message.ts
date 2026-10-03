/*
MobileWeb Auth Message Translation
名稱：會員錯誤訊息翻譯
說明：Neon Auth client 的錯誤代碼不在 better-auth-ui 預期的位置（error.error.code），
      套件因此直接顯示伺服器的英文訊息。本函式在顯示 toast 前把英文訊息轉成繁體中文：
      先以套件預設英文字串反查，再查伺服器特有訊息的補充對照；都查不到時保留原文

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／會員註冊登入]
*/

import { authLocalization, type AuthLocalization } from "@neondatabase/auth-ui/server";
import { objZhTwLocalization } from "@/lib/auth/localization-zh-tw";

/** 伺服器訊息與套件預設英文不同者的補充對照（伺服器英文訊息 → 字串鍵） */
const objServerMessageKeys: Record<string, keyof AuthLocalization> = {
    "User already exists. Use another email.": "USER_ALREADY_EXISTS",
};

/** 套件預設英文字串 → 字串鍵（不分大小寫、忽略句尾句點） */
const mapEnglishToKey = new Map<string, keyof AuthLocalization>(
    (Object.keys(authLocalization) as Array<keyof AuthLocalization>).map((_strKey) => [
        normalizeMessage(authLocalization[_strKey]),
        _strKey,
    ]),
);

/**
 * 正規化訊息以便比對
 * @param {string} _strMessage 訊息
 * @returns {string} 去除前後空白與句尾句點的小寫字串
 */
function normalizeMessage(_strMessage: string): string {
    return _strMessage.trim().replace(/\.+$/, "").toLowerCase();
}

/**
 * 將會員功能的英文訊息翻成繁體中文
 * @param {string | undefined} _strMessage 原始訊息
 * @returns {string | undefined} 翻譯後的訊息；查不到對照時回傳原文
 */
export function translateAuthMessage(_strMessage: string | undefined): string | undefined {
    if (!_strMessage) {
        return _strMessage;
    }

    const strKey = objServerMessageKeys[_strMessage] ?? mapEnglishToKey.get(normalizeMessage(_strMessage));
    return strKey ? objZhTwLocalization[strKey] : _strMessage;
}
