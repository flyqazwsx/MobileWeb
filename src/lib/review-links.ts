/*
MobileWeb Review Links
名稱：網路評測連結產生器
說明：原型階段尚未收錄實際評測影片，先依手機名稱產生各平台的搜尋連結；
      之後可改為從資料庫讀取編輯精選的影片網址

[Change Log]
--------------------------------------------------------------------------------
Format: [YYYY-MM-DD] [Author] [Description]
Rule: One change per line. Append new entries at the bottom.
--------------------------------------------------------------------------------
[2026-10-03] [flyqazwsx] [系統初版／基本原型]
*/

import type { ReviewLink } from "@/lib/types";

/**
 * 依手機名稱建立 YouTube、Facebook、Instagram 評測搜尋連結
 * @param {string} _strPhoneName 手機名稱
 * @returns {ReviewLink[]} 評測連結
 */
export function createReviewLinks(_strPhoneName: string): ReviewLink[] {
    const strQuery = encodeURIComponent(`${_strPhoneName} 評測`);
    const strHashtag = encodeURIComponent(_strPhoneName.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase());

    return [
        {
            platform: "YouTube",
            label: `在 YouTube 搜尋「${_strPhoneName} 評測」`,
            url: `https://www.youtube.com/results?search_query=${strQuery}`,
        },
        {
            platform: "Facebook",
            label: `在 Facebook 搜尋「${_strPhoneName} 評測」`,
            url: `https://www.facebook.com/search/videos/?q=${strQuery}`,
        },
        {
            platform: "Instagram",
            label: `在 Instagram 瀏覽 #${decodeURIComponent(strHashtag)}`,
            url: `https://www.instagram.com/explore/tags/${strHashtag}/`,
        },
    ];
}
