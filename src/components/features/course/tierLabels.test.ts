import { describe, expect, it } from "vitest"
import { resolveTierColor } from "./tierLabels"

/**
 * Màu chip gói khoá theo SLUG cố định toàn hệ (góp ý website 2026-07-26). Test giữ 2 điều:
 * 3 bậc chuẩn ra 3 màu KHÁC nhau (nếu trùng thì badge lại đồng phục như cũ), và gói tên tự
 * do vẫn có màu chứ không rơi ra `undefined` (Chip mất màu).
 */
describe("resolveTierColor", () => {
    it("cho 3 bậc chuẩn 3 màu khác nhau", () => {
        const colors = ["basic", "premium", "master"].map(resolveTierColor)
        expect(new Set(colors).size).toBe(3)
    })

    it("giữ cùng một màu cho cùng một gói, không phụ thuộc khoá", () => {
        expect(resolveTierColor("premium")).toBe(resolveTierColor("premium"))
        expect(resolveTierColor("master")).toBe("warning")
    })

    it("gói tên tự do rơi về default thay vì undefined", () => {
        expect(resolveTierColor("on-tap-thuc-chien")).toBe("default")
        expect(resolveTierColor("goi-la-hoac-toi-nghi-ra")).toBe("default")
    })
})
