import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

/**
 * Chính sách CACHE cho asset tĩnh — ghim bằng test vì nó vô hình khi hỏng.
 *
 * <p><b>Vì sao cần ghim.</b> Next KHÔNG đặt cache dài cho `/public`: mặc định là
 * `max-age=0, must-revalidate`, nghĩa là mỗi lần vào trang là một vòng đi-về mạng cho TỪNG ảnh.
 * Đã đo trên production: `/fes-mascot-wave.webp` (427 KB) trả `304` ở mọi lần tải. Thư mục
 * `/public` đang 21 MB / 97 ảnh. Mất khối `headers()` này thì trang chậm lại y như cũ mà KHÔNG
 * test nào đỏ, không log nào kêu, và trên máy dev có cache nóng thì cũng không ai thấy.
 *
 * <p>Test đọc thẳng `next.config.ts` chứ không import nó: file đó chạy qua plugin `next-intl`
 * và đọc `process.env`, nạp vào môi trường test là kéo theo cả một nửa Next.
 */
describe("chính sách cache asset tĩnh (next.config.ts)", () => {
    const config = readFileSync(resolve(process.cwd(), "next.config.ts"), "utf8")

    it("có luật headers cho asset tĩnh", () => {
        expect(config).toContain("async headers()")
    })

    /** Danh sách đuôi trong chính luật `source`, không phải "có xuất hiện đâu đó trong file". */
    const sourceRule = /source:\s*"([^"]+)"/.exec(config)?.[1] ?? ""

    it("phủ ĐỦ các đuôi file thật sự có trong /public", () => {
        // Thiếu một đuôi nghĩa là đúng nhóm ảnh đó âm thầm quay về max-age=0.
        for (const ext of ["svg", "png", "jpg", "jpeg", "webp", "avif", "gif", "ico", "woff2", "glb"]) {
            expect(sourceRule.split(/[|()*:/]/), `thiếu đuôi .${ext} trong luật cache`).toContain(ext)
        }
    })

    it("cache đủ dài để KHÔNG hỏi lại trong ngày", () => {
        expect(config).toMatch(/max-age=86400/)
    })

    it("có stale-while-revalidate — ảnh thay vẫn tới tay mà không ai phải chờ", () => {
        expect(config).toMatch(/stale-while-revalidate=\d+/)
    })

    it("KHÔNG dùng immutable cho /public", () => {
        // File trong /public không có băm nội dung trong tên (art linh vật, ảnh bìa môn đều thay
        // tại chỗ). `immutable` = người dùng cũ giữ ảnh cũ tới khi hết hạn, không cách nào ép.
        const headersBlock = config.slice(config.indexOf("async headers()"), config.indexOf("experimental"))
        expect(headersBlock).not.toContain("immutable")
    })

    it("giữ Router Cache khi quay lại trang đã xem", () => {
        // Mặc định Next 16 là `dynamic: 0` — quay lại trang vừa rời là tải lại payload RSC kèm
        // nguyên màn khung xương. Đây chính là cảm giác "trang nào cũng load lại".
        expect(config).toMatch(/staleTimes:\s*\{/)
        expect(config).toMatch(/dynamic:\s*30/)
    })
})
