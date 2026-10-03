import { afterEach, describe, expect, it, vi } from "vitest";

// 每個測試重新載入模組，避免前一個測試建立的連線被重複使用
afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
});

describe("getSql", () => {
    it("未設定 DATABASE_URL 時丟出提示錯誤", async () => {
        vi.stubEnv("DATABASE_URL", "");
        const { getSql } = await import("@/lib/db");
        expect(() => getSql()).toThrow("未設定 DATABASE_URL");
    });

    it("建立後重複呼叫取得同一個查詢函式", async () => {
        vi.stubEnv("DATABASE_URL", "postgresql://user:password@example.neon.tech/db");
        const { getSql } = await import("@/lib/db");
        expect(getSql()).toBe(getSql());
    });
});
