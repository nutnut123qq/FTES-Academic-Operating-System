import { describe, expect, it } from "vitest"
import { isSummaryLocked } from "./index"

describe("isSummaryLocked", () => {
    it("cho quay lại bước Tóm tắt khi CHƯA thanh toán (đang chọn phương thức)", () => {
        expect(isSummaryLocked("choose")).toBe(false)
    })

    // Regression: sau khi QR hiện / xu đã trừ, không được rewind về Tóm tắt sửa đơn.
    it("khoá bước Tóm tắt khi QR đang chờ / đã thành công / thất bại", () => {
        expect(isSummaryLocked("awaiting")).toBe(true)
        expect(isSummaryLocked("success")).toBe(true)
        expect(isSummaryLocked("failed")).toBe(true)
    })
})
