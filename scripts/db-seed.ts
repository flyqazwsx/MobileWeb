/*
MobileWeb DB Seed
名稱：匯入示範資料
說明：以 src/data 的示範資料覆蓋資料庫內容（先清空三張表再重新寫入，整批在同一個交易中完成）。
      正式資料匯入流程（手機王、傑昇通信）完成前，資料庫內容以本腳本為準
用法：npm run db:seed

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／改接 Neon 資料庫]
*/

import { arrBrandData } from "../src/data/brands";
import { arrPhoneData } from "../src/data/phones";
import { createScriptSql } from "./db-script-client";

/**
 * 匯入品牌、手機與相機資料
 * @returns {Promise<void>}
 */
async function seedDatabase(): Promise<void> {
    const objSql = createScriptSql();

    await objSql.transaction((_objTxn) => [
        _objTxn`DELETE FROM TBL_PHONE_CAMERA`,
        _objTxn`DELETE FROM TBL_PHONE`,
        _objTxn`DELETE FROM TBL_BRAND`,

        ...arrBrandData.map(
            (_objBrand, _intIndex) => _objTxn`
                INSERT INTO TBL_BRAND (SLUG, NAME, COLOR, SORT_ORDER)
                VALUES (${_objBrand.slug}, ${_objBrand.name}, ${_objBrand.color}, ${_intIndex + 1})`,
        ),

        ...arrPhoneData.map((_objPhone) => {
            const objSpecs = _objPhone.specs;
            return _objTxn`
                INSERT INTO TBL_PHONE (
                    SLUG, BRAND_SLUG, NAME, RELEASE_MONTH, HOT_RANK, MSRP_TWD, SALE_PRICE_TWD, IMAGE_URL,
                    HEIGHT_MM, WIDTH_MM, DEPTH_MM, WEIGHT_G, CPU, RAM_GB, STORAGE_GB,
                    DISPLAY_SIZE_INCH, DISPLAY_RESOLUTION, DISPLAY_PANEL, DISPLAY_REFRESH_HZ,
                    VIDEO, BATTERY_MAH, OS
                ) VALUES (
                    ${_objPhone.slug}, ${_objPhone.brandSlug}, ${_objPhone.name}, ${_objPhone.releaseMonth},
                    ${_objPhone.hotRank}, ${_objPhone.msrpTwd}, ${_objPhone.salePriceTwd}, ${_objPhone.imageUrl},
                    ${objSpecs.dimensions.heightMm}, ${objSpecs.dimensions.widthMm}, ${objSpecs.dimensions.depthMm},
                    ${objSpecs.weightG}, ${objSpecs.cpu}, ${objSpecs.ramGb}, ${objSpecs.storageGb},
                    ${objSpecs.display.sizeInch}, ${objSpecs.display.resolution}, ${objSpecs.display.panel},
                    ${objSpecs.display.refreshHz}, ${objSpecs.video}, ${objSpecs.batteryMah}, ${objSpecs.os}
                )`;
        }),

        ...arrPhoneData.flatMap((_objPhone) =>
            [
                ..._objPhone.specs.rearCameras.map((_objLens, _intIndex) => ({ objLens: _objLens, blnFront: false, intOrder: _intIndex + 1 })),
                { objLens: _objPhone.specs.frontCamera, blnFront: true, intOrder: 1 },
            ].map(
                (_objItem) => _objTxn`
                    INSERT INTO TBL_PHONE_CAMERA (PHONE_SLUG, IS_FRONT, SORT_ORDER, LENS_ROLE, MEGAPIXELS, DETAIL)
                    VALUES (
                        ${_objPhone.slug}, ${_objItem.blnFront}, ${_objItem.intOrder},
                        ${_objItem.objLens.role}, ${_objItem.objLens.megapixels}, ${_objItem.objLens.detail}
                    )`,
            ),
        ),
    ]);

    console.log(`✓ 已匯入品牌 ${arrBrandData.length} 筆、手機 ${arrPhoneData.length} 筆`);
}

seedDatabase().catch((_objError: unknown) => {
    console.error("匯入示範資料失敗：", _objError instanceof Error ? _objError.message : _objError);
    process.exitCode = 1;
});
