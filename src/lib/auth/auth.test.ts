import { authLocalization } from "@neondatabase/auth-ui/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { objZhTwLocalization } from "@/lib/auth/localization-zh-tw";

// 以替身取代 Neon Auth 套件，只驗證本站傳入的設定
// vi.mock 會提升到檔案最上方，替身函式需以 vi.hoisted 建立
const { fnCreateNeonAuth, fnCreateAuthClient } = vi.hoisted(() => ({
    fnCreateNeonAuth: vi.fn((..._arrArgs: unknown[]) => ({ handler: vi.fn(), middleware: vi.fn(), arrArgs: _arrArgs })),
    fnCreateAuthClient: vi.fn(() => ({ signIn: vi.fn() })),
}));

vi.mock("@neondatabase/auth/next/server", () => ({ createNeonAuth: fnCreateNeonAuth }));
vi.mock("@neondatabase/auth/next", () => ({ createAuthClient: fnCreateAuthClient }));

describe("會員介面繁體中文字串", () => {
    it("涵蓋套件全部字串鍵，且未覆寫的沿用預設值", () => {
        expect(Object.keys(objZhTwLocalization).sort()).toEqual(Object.keys(authLocalization).sort());
        expect(objZhTwLocalization.TEAMS).toBe(authLocalization.TEAMS);
    });

    it("登入、註冊與常見錯誤訊息為繁體中文", () => {
        expect(objZhTwLocalization.SIGN_IN).toBe("登入");
        expect(objZhTwLocalization.SIGN_UP_ACTION).toBe("建立帳號");
        expect(objZhTwLocalization.INVALID_EMAIL_OR_PASSWORD).toBe("電子郵件或密碼錯誤");
        expect(objZhTwLocalization.USER_ALREADY_EXISTS).toBe("這個電子郵件已經註冊過");
    });

    it("沒有使用簡體字或中國大陸用語", () => {
        const strAllText = Object.values(objZhTwLocalization).join("");
        for (const strWord of ["账", "号", "码", "登录", "设置", "信息", "邮箱", "用户"]) {
            expect(strAllText, strWord).not.toContain(strWord);
        }
    });
});

describe("會員錯誤訊息翻譯", () => {
    it("伺服器英文訊息與套件預設字串相同時，翻成對應的中文", async () => {
        const { translateAuthMessage } = await import("@/lib/auth/translate-auth-message");
        expect(translateAuthMessage("Invalid email or password")).toBe("電子郵件或密碼錯誤");
        expect(translateAuthMessage("Password too short")).toBe("密碼太短（至少 8 個字元）");
    });

    it("比對時忽略大小寫與句尾句點", async () => {
        const { translateAuthMessage } = await import("@/lib/auth/translate-auth-message");
        expect(translateAuthMessage("invalid email or password.")).toBe("電子郵件或密碼錯誤");
    });

    it("伺服器特有訊息查補充對照（重複註冊）", async () => {
        const { translateAuthMessage } = await import("@/lib/auth/translate-auth-message");
        expect(translateAuthMessage("User already exists. Use another email.")).toBe("這個電子郵件已經註冊過");
    });

    it("查不到對照或沒有訊息時保留原值", async () => {
        const { translateAuthMessage } = await import("@/lib/auth/translate-auth-message");
        expect(translateAuthMessage("Some brand new server error")).toBe("Some brand new server error");
        expect(translateAuthMessage(undefined)).toBeUndefined();
        expect(translateAuthMessage("")).toBe("");
    });
});

describe("會員驗證伺服器設定", () => {
    beforeEach(() => {
        vi.resetModules();
        fnCreateNeonAuth.mockClear();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("優先使用 Vercel 整合注入的 DATABASE_NEON_AUTH_BASE_URL", async () => {
        vi.stubEnv("DATABASE_NEON_AUTH_BASE_URL", "https://integration.example/auth");
        vi.stubEnv("NEON_AUTH_BASE_URL", "https://standard.example/auth");
        vi.stubEnv("NEON_AUTH_COOKIE_SECRET", "s".repeat(32));

        const objModule = await import("@/lib/auth/server");

        expect(objModule.getAuthBaseUrl()).toBe("https://integration.example/auth");
        expect(fnCreateNeonAuth).toHaveBeenCalledWith({
            baseUrl: "https://integration.example/auth",
            cookies: { secret: "s".repeat(32) },
        });
    });

    it("沒有整合變數時改用標準名稱 NEON_AUTH_BASE_URL", async () => {
        vi.stubEnv("DATABASE_NEON_AUTH_BASE_URL", undefined);
        vi.stubEnv("NEON_AUTH_BASE_URL", "https://standard.example/auth");

        const objModule = await import("@/lib/auth/server");

        expect(objModule.getAuthBaseUrl()).toBe("https://standard.example/auth");
    });

    it("都未設定時傳入空字串，由套件在實際呼叫時回報錯誤", async () => {
        vi.stubEnv("DATABASE_NEON_AUTH_BASE_URL", undefined);
        vi.stubEnv("NEON_AUTH_BASE_URL", undefined);
        vi.stubEnv("NEON_AUTH_COOKIE_SECRET", undefined);

        await import("@/lib/auth/server");

        expect(fnCreateNeonAuth).toHaveBeenCalledWith({ baseUrl: "", cookies: { secret: "" } });
    });
});

describe("會員驗證瀏覽器端 client", () => {
    it("以預設設定建立（走本站 /api/auth）", async () => {
        const objModule = await import("@/lib/auth/client");
        expect(fnCreateAuthClient).toHaveBeenCalledWith();
        expect(objModule.authClient).toBeDefined();
    });
});
