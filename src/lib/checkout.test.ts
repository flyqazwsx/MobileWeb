import { describe, expect, it } from "vitest";
import { createOrderNo, isCardExpiryValid, objDummyCheckout, validateCheckoutForm, type CheckoutFormInput } from "@/lib/checkout";

const DT_NOW = new Date("2026-10-04T12:00:00+08:00");

/**
 * 以示範資料為底，覆寫部分欄位
 * @param {Partial<CheckoutFormInput>} _objOverrides 要覆寫的欄位
 * @returns {CheckoutFormInput} 表單值
 */
function createInput(_objOverrides: Partial<CheckoutFormInput> = {}): CheckoutFormInput {
    return { ...objDummyCheckout, ..._objOverrides };
}

describe("validateCheckoutForm", () => {
    it("預填的示範資料直接送出即通過，只保留卡別與末四碼", () => {
        const objResult = validateCheckoutForm(createInput(), DT_NOW);
        expect(objResult).toEqual({
            ok: true,
            data: {
                recipientName: "王小明",
                recipientPhone: "0912-345-678",
                shippingAddress: "臺北市信義區示範路 100 號 5 樓",
                paymentMethod: "CREDIT_CARD",
                cardBrand: "VISA",
                cardLast4: "4242",
            },
        });
        expect(JSON.stringify(objResult)).not.toContain("4242424242424242");
    });

    it("手機號碼去除符號後統一格式；姓名與地址去除前後空白", () => {
        const objResult = validateCheckoutForm(
            createInput({ recipientPhone: "0987654321", recipientName: "  李小華 ", shippingAddress: " 新北市板橋區示範街 1 號 " }),
            DT_NOW,
        );
        expect(objResult.ok && objResult.data).toMatchObject({
            recipientPhone: "0987-654-321",
            recipientName: "李小華",
            shippingAddress: "新北市板橋區示範街 1 號",
        });
    });

    it.each([
        ["5555 5555 5555 4444", "MASTERCARD", "4444"],
        ["3566-0020-2036-0505", "JCB", "0505"],
    ])("其他測試卡號 %s 判斷為 %s", (_strCard, _strBrand, _strLast4) => {
        const objResult = validateCheckoutForm(createInput({ cardNumber: _strCard }), DT_NOW);
        expect(objResult.ok && objResult.data).toMatchObject({ cardBrand: _strBrand, cardLast4: _strLast4 });
    });

    it("非測試卡號一律拒絕（避免誤填真實信用卡）", () => {
        const objResult = validateCheckoutForm(createInput({ cardNumber: "4111 1111 1111 1112" }), DT_NOW);
        expect(objResult).toEqual({ ok: false, errors: { cardNumber: "示範網站只接受測試卡號，請勿輸入真實信用卡" } });
    });

    it.each<[keyof CheckoutFormInput, string]>([
        ["recipientName", "  "],
        ["recipientName", "名".repeat(51)],
        ["recipientPhone", "0212345678"],
        ["recipientPhone", "091234567"],
        ["shippingAddress", "台北市"],
        ["paymentMethod", "ATM"],
        ["cardHolder", ""],
        ["cardExpiry", "13/30"],
        ["cardExpiry", "09/26"],
        ["cardCvc", "12"],
        ["cardCvc", "12a"],
    ])("欄位 %s 為「%s」時檢核失敗", (_strField, _strValue) => {
        const objResult = validateCheckoutForm(createInput({ [_strField]: _strValue }), DT_NOW);
        expect(objResult.ok).toBe(false);
        expect(!objResult.ok && Object.keys(objResult.errors)).toEqual([_strField]);
    });

    it("多個欄位錯誤時一次列出", () => {
        const objResult = validateCheckoutForm(createInput({ recipientName: "", cardCvc: "" }), DT_NOW);
        expect(!objResult.ok && Object.keys(objResult.errors).sort()).toEqual(["cardCvc", "recipientName"]);
    });
});

describe("isCardExpiryValid（邊界值）", () => {
    it("本月有效、上個月無效", () => {
        expect(isCardExpiryValid("10/26", DT_NOW)).toBe(true);
        expect(isCardExpiryValid("09/26", DT_NOW)).toBe(false);
        expect(isCardExpiryValid("01/27", DT_NOW)).toBe(true);
    });

    it.each(["1/30", "00/30", "12/2030", "abc", ""])("格式錯誤「%s」無效", (_strExpiry) => {
        expect(isCardExpiryValid(_strExpiry, DT_NOW)).toBe(false);
    });
});

describe("createOrderNo", () => {
    it("格式為 MW + 台灣日期 + 6 碼英數", () => {
        expect(createOrderNo(DT_NOW)).toMatch(/^MW20261004-[A-Z2-9]{6}$/);
    });

    it("以台灣時區決定日期（UTC 前一天晚上 = 台灣當天早上）", () => {
        expect(createOrderNo(new Date("2026-10-03T17:30:00Z"), () => 0)).toBe("MW20261004-AAAAAA");
    });

    it("不使用容易混淆的 0、O、1、I", () => {
        const strSuffix = createOrderNo(DT_NOW, () => 0.999).split("-")[1];
        expect(strSuffix).not.toMatch(/[01OI]/);
    });
});
