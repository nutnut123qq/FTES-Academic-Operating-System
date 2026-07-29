import { describe, expect, it } from "vitest"
import { computeCartSavings, lineSaving } from "./cartSavings"
import type { CartItemView } from "@/modules/api/rest/commerce"

/** A cart line with the given prices; `quantity` defaults to 1 (a course is added once). */
const line = (
    overrides: Partial<CartItemView> & Pick<CartItemView, "id">,
): CartItemView => ({
    productId: "p",
    quantity: 1,
    ...overrides,
})

describe("lineSaving", () => {
    it("là khoảng giảm list − charged (không nhân số lượng)", () => {
        expect(lineSaving(line({ id: "a", unitPrice: 200_000, originalPriceVnd: 300_000 }))).toBe(
            100_000,
        )
    })

    // Regression: một khóa chỉ vào giỏ 1 lần → tiết kiệm KHÔNG được × quantity dù field còn đó.
    it("bỏ qua quantity: quantity=3 vẫn ra đúng list − charged một lần", () => {
        expect(
            lineSaving(line({ id: "a", quantity: 3, unitPrice: 200_000, originalPriceVnd: 300_000 })),
        ).toBe(100_000)
    })

    it("0 khi không có giá gốc cao hơn giá charged", () => {
        expect(lineSaving(line({ id: "a", unitPrice: 200_000 }))).toBe(0)
        expect(lineSaving(line({ id: "a", unitPrice: 200_000, originalPriceVnd: 200_000 }))).toBe(0)
    })
})

describe("computeCartSavings", () => {
    it("dùng subtotal BE làm current total, original = current + saved", () => {
        const items = [
            line({ id: "a", unitPrice: 200_000, originalPriceVnd: 300_000 }),
            line({ id: "b", unitPrice: 150_000, originalPriceVnd: 150_000 }),
        ]
        const result = computeCartSavings(items, 350_000)
        expect(result.currentTotal).toBe(350_000)
        expect(result.savedAmount).toBe(100_000)
        expect(result.originalTotal).toBe(450_000)
        expect(result.savedPercent).toBe(Math.round((100_000 / 450_000) * 100))
        expect(result.hasSavings).toBe(true)
    })

    it("không nhân quantity khi cộng dồn charged/saved", () => {
        const items = [line({ id: "a", quantity: 5, unitPrice: 200_000, originalPriceVnd: 300_000 })]
        // subtotal bỏ trống → current = tổng charged các dòng (unit, không × qty)
        const result = computeCartSavings(items)
        expect(result.currentTotal).toBe(200_000)
        expect(result.savedAmount).toBe(100_000)
        expect(result.originalTotal).toBe(300_000)
    })

    it("hasSavings=false khi không dòng nào có giảm", () => {
        const items = [line({ id: "a", unitPrice: 200_000 })]
        const result = computeCartSavings(items, 200_000)
        expect(result.hasSavings).toBe(false)
        expect(result.savedAmount).toBe(0)
        expect(result.savedPercent).toBe(0)
    })
})
