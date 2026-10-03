/*
MobileWeb Migration 002
名稱：建立購物車資料表
說明：每位會員每支手機一列，數量 1–99。
      USER_ID 對應 Neon Auth 的 neon_auth."user"(id)（UUID），會員被刪除時購物車一併刪除；
      PHONE_SLUG 對應 TBL_PHONE，外鍵設為 DEFERRABLE INITIALLY DEFERRED，
      讓 db:seed 在同一個交易內「刪除後重新寫入」手機資料時不會被購物車擋下（交易結束時才檢查）

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-04] [flyqazwsx] [系統初版／購物車]
*/

CREATE TABLE IF NOT EXISTS TBL_CART_ITEM (
    USER_ID     UUID         NOT NULL,
    PHONE_SLUG  VARCHAR(100) NOT NULL,
    QUANTITY    INTEGER      NOT NULL,
    CREATED_AT  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UPDATED_AT  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT PK_TBL_CART_ITEM PRIMARY KEY (USER_ID, PHONE_SLUG),
    CONSTRAINT FK_TBL_CART_ITEM_USER FOREIGN KEY (USER_ID) REFERENCES neon_auth."user" (id) ON DELETE CASCADE,
    CONSTRAINT FK_TBL_CART_ITEM_PHONE FOREIGN KEY (PHONE_SLUG) REFERENCES TBL_PHONE (SLUG) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT CK_TBL_CART_ITEM_QUANTITY CHECK (QUANTITY BETWEEN 1 AND 99)
);

CREATE INDEX IF NOT EXISTS IX_TBL_CART_ITEM_PHONE_SLUG ON TBL_CART_ITEM (PHONE_SLUG);
