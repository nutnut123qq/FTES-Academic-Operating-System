import { describe, expect, it } from "vitest"
import { firstLinkUrl, splitBodyImages, unwrapAutolinks } from "./postLinks"

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

/**
 * Ảnh chèn bằng THANH CÔNG CỤ của editor nằm trong THÂN BÀI (`![Ảnh](url)`), không thành
 * attachment — mà hàng feed in trích đoạn dưới dạng text thuần. Trước khi vá, bạn đọc thấy
 * đúng cú pháp thô đó trên hàng và KHÔNG có tấm ảnh nào (media rỗng ⇒ `PostMediaGrid` trả
 * null). Bộ case này ghim cả hai vế: chữ hết cú pháp, url ra đúng chỗ để vẽ thumbnail.
 */
describe("splitBodyImages", () => {
    it("lifts a toolbar-inserted image out of the prose", () => {
        const snippet = "Chào cả nhà ![Ảnh](https://document.ftes.vn/a.webp) mình mới học xong"
        expect(splitBodyImages(snippet)).toEqual({
            text: "Chào cả nhà mình mới học xong",
            images: ["https://document.ftes.vn/a.webp"],
        })
    })

    it("keeps every image of a post, in author order, without repeats", () => {
        const snippet = "![Ảnh](https://x.vn/1.webp)\n\n![Ảnh](https://x.vn/2.webp)\n![Ảnh](https://x.vn/1.webp)"
        expect(splitBodyImages(snippet)).toEqual({
            text: "",
            images: ["https://x.vn/1.webp", "https://x.vn/2.webp"],
        })
    })

    // BE cắt snippet ở đúng 200 ký tự rồi nối "…" (FeedController.snippetOf), nên cái đuôi
    // thường là một marker ĐỨT — không quy tắc ảnh/link nào khớp, và nó in ra nguyên văn.
    it("drops a marker the backend cut in half", () => {
        expect(splitBodyImages("Bài dài ![Ảnh](https://document.ftes.vn/a.web…").text).toBe("Bài dài")
        expect(splitBodyImages("Bài dài ![Ản…").text).toBe("Bài dài")
        expect(splitBodyImages("Xem [tài liệu](https://ftes.vn/ta…").text).toBe("Xem")
    })

    it("keeps a markdown link's visible text and drops its syntax", () => {
        expect(splitBodyImages("Xem [tài liệu](https://ftes.vn/x) nhé").text).toBe("Xem tài liệu nhé")
    })

    // `storageKey` của item trả ra được cắm thẳng vào `<img src>` mà nguồn là chữ tác giả gõ,
    // nên chỉ nhận http(s) — thứ khác không thể là ảnh đã upload thật.
    it("refuses a non-http image target but still cleans the syntax", () => {
        expect(splitBodyImages("Xem ![x](data:image/svg+xml;base64,AAA) nhé")).toEqual({
            text: "Xem nhé",
            images: [],
        })
    })

    it("leaves a post without images alone", () => {
        expect(splitBodyImages("Một đoạn bình thường, có [ngoặc] và giá 3 (ba)")).toEqual({
            text: "Một đoạn bình thường, có [ngoặc] và giá 3 (ba)",
            images: [],
        })
    })

    // Nút chèn ảnh chỉ là MỘT nút trên thanh công cụ của composer; các nút bên cạnh
    // (H1/H2/H3, đậm, nghiêng, gạch chân, gạch ngang, bullet, đánh số, trích dẫn) cũng
    // serialize ra markdown và cũng bị hàng feed in nguyên văn. Ghim từng dạng một.
    it("strips every markdown mark the composer toolbar can produce", () => {
        expect(splitBodyImages("## Mục 2\n**Quan trọng** và *nhớ* và ~~bỏ~~ và <u>gạch chân</u>").text)
            .toBe("Mục 2 Quan trọng và nhớ và bỏ và gạch chân")
        expect(splitBodyImages("- một\n- hai\n\n1. ba\n2) bốn\n\n> trích dẫn").text)
            .toBe("một hai ba bốn trích dẫn")
        expect(splitBodyImages("__đậm gạch dưới__").text).toBe("đậm gạch dưới")
    })

    // Dấu `*`/`~` rời trong văn xuôi KHÔNG phải cú pháp nhấn (luật flanking của CommonMark),
    // còn `_` đơn trong văn xuôi kỹ thuật gần như luôn là snake_case.
    it("never eats punctuation that is not an emphasis pair", () => {
        expect(splitBodyImages("2 * 3 * 4 = 24 và a ~ b").text).toBe("2 * 3 * 4 = 24 và a ~ b")
        expect(splitBodyImages("cột total_count_x của bảng").text).toBe("cột total_count_x của bảng")
        expect(splitBodyImages("-5 độ, 3.14 mét").text).toBe("-5 độ, 3.14 mét")
    })

    // Cộng đồng học tập đăng snippet code suốt ngày. Ảnh/cú pháp NẰM TRONG code là VÍ DỤ
    // của tác giả: lôi url ra thì hàng feed mọc một thumbnail ma, còn phần chữ trơ lại
    // mấy dấu rào. `firstLinkUrl` cùng file đã né code từ đầu, đường này thì chưa.
    it("treats code as a quote: no image lifted, the sample stays readable", () => {
        expect(splitBodyImages("Cú pháp chèn ảnh:\n```\n![a](https://a.b/1.png)\n```")).toEqual({
            text: "Cú pháp chèn ảnh: ![a](https://a.b/1.png)",
            images: [],
        })
        expect(splitBodyImages("gõ `**đậm**` để in đậm").text).toBe("gõ **đậm** để in đậm")
        expect(splitBodyImages("```js\nconst a = 1\n```").text).toBe("const a = 1")
        // Ảnh THẬT ngoài code vẫn ra thumbnail như thường, dù bài có kèm code.
        expect(splitBodyImages("![Ảnh](https://x.vn/1.webp)\n```\n# tiêu đề giả\n```")).toEqual({
            text: "# tiêu đề giả",
            images: ["https://x.vn/1.webp"],
        })
    })
})
