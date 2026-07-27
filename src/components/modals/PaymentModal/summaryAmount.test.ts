import { describe, expect, it } from "vitest"
import { summaryAmount } from "./index"

describe("summaryAmount", () => {
    it("hiển thị giá Xu khi người dùng chọn trả bằng Xu", () => {
        expect(summaryAmount("COIN", 299_000, 2_990)).toEqual({ unit: "coin", value: 2_990 })
    })

    it("hiển thị giá VND khi chọn chuyển khoản", () => {
        expect(summaryAmount("VIETQR", 299_000, 2_990)).toEqual({ unit: "vnd", value: 299_000 })
    })

    // Regression: trước đây dòng tóm tắt bám vào "sản phẩm CÓ giá VND" nên chọn Xu vẫn in giá VND.
    it("không rơi về giá VND chỉ vì sản phẩm có giá VND", () => {
        expect(summaryAmount("COIN", 299_000, 2_990).unit).toBe("coin")
    })

    it("coi thiếu giá Xu là 0 thay vì undefined", () => {
        expect(summaryAmount("COIN", 299_000)).toEqual({ unit: "coin", value: 0 })
    })
})
