import { describe, expect, it } from "vitest"
import type { PostResponse } from "@/modules/api/rest/community/types"
import { toSavedPost } from "./useQueryBookmarkedPostsSwr"

/**
 * Unit — mapper của danh sách bookmark, nguồn dữ liệu cho `/community/saved`, `/saved`
 * (SavedLibrary) và khối "Đã lưu" ở dashboard.
 *
 * Cả ba bề mặt in `snippet` dưới dạng TEXT THUẦN, và riêng `/saved` còn ghép
 * `title — snippet` làm CHUỖI TÌM KIẾM. Nếu autolink `<https://…>` giữ nguyên cặp `<>` thì
 * người dùng vừa thấy dấu ngoặc trên màn hình vừa gõ đúng URL mà không ra kết quả — nên
 * hợp đồng "snippet đã bỏ `<>`" được ghim ở đây.
 */

const bookmarked = (content: string): PostResponse =>
    ({
        id: "p1",
        authorId: "a1",
        title: "Tài liệu Kafka",
        content,
        createdAt: "2026-08-15T00:00:00Z",
        likeCount: 0,
        commentCount: 0,
    }) as unknown as PostResponse

describe("toSavedPost", () => {
    it("bỏ cặp <> của autolink trong snippet (hàng lưu + haystack tìm kiếm sạch)", () => {
        const post = toSavedPost(bookmarked("Xem tại <https://ftes.vn/tai-lieu> nhé"), "vi")
        expect(post.snippet).toBe("Xem tại https://ftes.vn/tai-lieu nhé")
        // haystack của SavedLibrary = `${title} — ${snippet}` → gõ đúng URL phải khớp
        expect(`${post.title} — ${post.snippet}`).toContain("https://ftes.vn/tai-lieu")
    })

    it("giữ nguyên `<`/`>` không phải autolink và url gõ trần", () => {
        expect(toSavedPost(bookmarked("a < b, dùng <div> để bọc"), "vi").snippet)
            .toBe("a < b, dùng <div> để bọc")
        expect(toSavedPost(bookmarked("Xem tại https://ftes.vn/x"), "vi").snippet)
            .toBe("Xem tại https://ftes.vn/x")
    })
})
