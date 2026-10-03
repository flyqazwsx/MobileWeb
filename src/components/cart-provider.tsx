/*
MobileWeb Cart Provider
名稱：購物車件數 Provider
說明：在瀏覽器端保存目前購物車總件數，供頁首圖示與「加入購物車」共用。
      登入狀態改變（登入、登出、換帳號）時重新向伺服器取得件數；未登入一律為 0

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／購物車]
*/

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCartCountAction } from "@/app/cart/actions";
import { authClient } from "@/lib/auth/client";

/** 購物車 context 內容 */
interface CartContextValue {
    /** 總件數 */
    count: number;
    /** 是否已登入 */
    isSignedIn: boolean;
    /** 是否仍在取得登入狀態（避免畫面先閃出未登入的內容） */
    isSessionPending: boolean;
    /** 直接設定件數（動作回傳最新件數時使用） */
    setCount: (_intCount: number) => void;
    /** 重新向伺服器取得件數 */
    refreshCount: () => Promise<void>;
}

const objCartContext = createContext<CartContextValue | null>(null);

interface CartProviderProps {
    children: ReactNode;
}

/**
 * 購物車件數 Provider
 * @param {CartProviderProps} _objProps 元件屬性
 * @returns {JSX.Element} 包上購物車 context 的子元件
 */
export default function CartProvider(_objProps: CartProviderProps) {
    const objSession = authClient.useSession();
    const strUserId = objSession.data?.user?.id ?? null;
    const blnSessionPending = objSession.isPending;
    // 件數連同所屬會員一起保存：換帳號或登出時，舊件數不會顯示在新的登入狀態上
    const [objCountState, setObjCountState] = useState<{ strUserId: string | null; intCount: number }>({
        strUserId: null,
        intCount: 0,
    });
    const intCount = strUserId !== null && objCountState.strUserId === strUserId ? objCountState.intCount : 0;

    const setCount = useCallback(
        (_intCount: number) => setObjCountState({ strUserId: strUserId, intCount: _intCount }),
        [strUserId],
    );

    const refreshCount = useCallback(async () => {
        if (strUserId) {
            setCount(await getCartCountAction());
        }
    }, [strUserId, setCount]);

    useEffect(() => {
        if (!strUserId) {
            return;
        }

        let blnCancelled = false;
        getCartCountAction().then((_intCount) => {
            if (!blnCancelled) {
                setObjCountState({ strUserId: strUserId, intCount: _intCount });
            }
        });

        return () => {
            blnCancelled = true;
        };
    }, [strUserId]);

    const objValue = useMemo<CartContextValue>(
        () => ({
            count: intCount,
            isSignedIn: strUserId !== null,
            isSessionPending: blnSessionPending,
            setCount,
            refreshCount,
        }),
        [intCount, strUserId, blnSessionPending, setCount, refreshCount],
    );

    return <objCartContext.Provider value={objValue}>{_objProps.children}</objCartContext.Provider>;
}

/**
 * 取得購物車 context
 * @returns {CartContextValue} 購物車件數與操作
 * @throws {Error} 不在 CartProvider 內使用時
 */
export function useCart(): CartContextValue {
    const objValue = useContext(objCartContext);

    if (!objValue) {
        throw new Error("useCart 必須在 CartProvider 內使用");
    }

    return objValue;
}
