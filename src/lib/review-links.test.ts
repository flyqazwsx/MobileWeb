import { describe, expect, it } from "vitest";
import { createReviewLinks } from "@/lib/review-links";

describe("createReviewLinks", () => {
    it("產生 YouTube、Facebook、Instagram 三個平台連結", () => {
        const arrLinks = createReviewLinks("iPhone 17 Pro");
        expect(arrLinks.map((_objLink) => _objLink.platform)).toEqual(["YouTube", "Facebook", "Instagram"]);
    });

    it("搜尋字串經過網址編碼並加上「評測」", () => {
        const arrLinks = createReviewLinks("Nothing Phone (3)");
        const objUrl = new URL(arrLinks[0].url);
        expect(objUrl.hostname).toBe("www.youtube.com");
        expect(objUrl.searchParams.get("search_query")).toBe("Nothing Phone (3) 評測");
    });

    it("Instagram hashtag 移除空白與符號並轉小寫", () => {
        const arrLinks = createReviewLinks("Nothing Phone (3)");
        expect(arrLinks[2].url).toBe("https://www.instagram.com/explore/tags/nothingphone3/");
        expect(arrLinks[2].label).toContain("#nothingphone3");
    });
});
