import { describe, expect, it } from "vitest"
import { firstLinkUrl, unwrapAutolinks } from "./postLinks"

describe("unwrapAutolinks", () => {
    it("drops the angle brackets so the url autolinks instead of printing raw", () => {
        expect(unwrapAutolinks("Xem tại <https://fullstack.edu.vn/blog/x> nhé"))
            .toBe("Xem tại https://fullstack.edu.vn/blog/x nhé")
    })

    it("leaves markdown links and plain html-ish text alone", () => {
        const body = "[F8](https://fullstack.edu.vn) và <b>đậm</b> và <em@ftes.vn>"
        expect(unwrapAutolinks(body)).toBe(body)
    })

    it("leaves a bare url exactly as typed", () => {
        expect(unwrapAutolinks("Xem tại https://a.vn/x nhé")).toBe("Xem tại https://a.vn/x nhé")
    })

    // Dòng feed in snippet dưới dạng text thuần, nên mọi `<`/`>` KHÔNG phải autolink
    // (so sánh toán học, thẻ html tác giả gõ) phải nguyên vẹn — chỉ cặp bao quanh url mới bị bỏ.
    it("never touches angle brackets that are not an autolink", () => {
        expect(unwrapAutolinks("a < b và b > c")).toBe("a < b và b > c")
        expect(unwrapAutolinks("dùng <div> để bọc")).toBe("dùng <div> để bọc")
        expect(unwrapAutolinks("<https://a.vn/x>")).toBe("https://a.vn/x")
    })
})

describe("firstLinkUrl", () => {
    it("returns the first url of the body, without trailing punctuation", () => {
        expect(firstLinkUrl("Tài liệu: https://ftes.vn/tai-lieu. Còn https://ftes.vn/b nữa"))
            .toBe("https://ftes.vn/tai-lieu")
    })

    it("reads a markdown link target and an autolink", () => {
        expect(firstLinkUrl("[F8](https://fullstack.edu.vn/learn)")).toBe("https://fullstack.edu.vn/learn")
        expect(firstLinkUrl("<https://ftes.vn/a>")).toBe("https://ftes.vn/a")
    })

    it("ignores urls inside code blocks", () => {
        expect(firstLinkUrl("```\ncurl https://internal.example.com\n```\nrồi https://ftes.vn/x"))
            .toBe("https://ftes.vn/x")
        expect(firstLinkUrl("dùng `https://ftes.vn/api` để gọi")).toBeNull()
    })

    it("returns null when the post has no link", () => {
        expect(firstLinkUrl("Bài viết không có link nào cả")).toBeNull()
    })
})
