import { describe, expect, it } from "vitest"
import type { CoinQuoteView } from "@/modules/api/rest/commerce"
import { clampCoinToApply, coinBreakdown, walletCoversAll } from "./coinDiscount"

/**
 * Báo giá mẫu: 1 Xu = 100đ, số dư 5.000 Xu, trần áp cho đơn 300.000đ là 3.000 Xu
 * (đúng bằng số tiền đơn) ⇒ ví trả trọn được.
 */
const quote = (over: Partial<CoinQuoteView> = {}): CoinQuoteView => ({
    balance: 5000,
    vndPerCoin: 100,
    maxApplicableCoin: 3000,
    maxDiscountVnd: 300000,
    // payableVnd = SỐ TIỀN ĐƯỢC HỎI (BE trả thẳng amountVnd/order.totalPrice vào đây),
    // KHÔNG phải phần dư sau khi áp Xu.
    payableVnd: 200000,
    ...over,
})

describe("clampCoinToApply", () => {
    it("giữ nguyên số Xu nằm trong trần", () => {
        expect(clampCoinToApply(1200, quote())).toBe(1200)
    })

    it("kẹp về trần của backend khi xin quá tay (KHÔNG gửi số vượt lên checkout)", () => {
        expect(clampCoinToApply(999999, quote())).toBe(3000)
    })

    it("kẹp theo SỐ DƯ khi số dư nhỏ hơn trần đơn", () => {
        expect(clampCoinToApply(3000, quote({ balance: 800 }))).toBe(800)
    })

    it("số âm / lẻ / NaN → 0 hoặc số nguyên, không bao giờ âm", () => {
        expect(clampCoinToApply(-50, quote())).toBe(0)
        expect(clampCoinToApply(120.9, quote())).toBe(120)
        expect(clampCoinToApply(Number.NaN, quote())).toBe(0)
    })

    it("chưa có báo giá → 0 (chưa biết trần thì không áp Xu)", () => {
        expect(clampCoinToApply(500, undefined)).toBe(0)
    })
})

describe("coinBreakdown — quy đổi hiển thị: Xu áp vào → tiền còn phải trả", () => {
    it("áp một phần: 1.200 Xu × 100đ = 120.000đ, còn phải trả 180.000đ", () => {
        expect(coinBreakdown(300000, 1200, quote())).toEqual({
            coinApplied: 1200,
            coinDiscountVnd: 120000,
            payableVnd: 180000,
        })
    })

    it("áp trọn trần: còn phải trả 0đ (đơn sẽ PAID ngay, không hiện QR)", () => {
        expect(coinBreakdown(300000, 3000, quote())).toEqual({
            coinApplied: 3000,
            coinDiscountVnd: 300000,
            payableVnd: 0,
        })
    })

    it("xin quá trần: hiển thị theo TRẦN chứ không theo số đã xin", () => {
        expect(coinBreakdown(300000, 99999, quote())).toEqual({
            coinApplied: 3000,
            coinDiscountVnd: 300000,
            payableVnd: 0,
        })
    })

    it("không dùng Xu → giữ nguyên số tiền", () => {
        expect(coinBreakdown(300000, 0, quote())).toEqual({
            coinApplied: 0,
            coinDiscountVnd: 0,
            payableVnd: 300000,
        })
    })

    it("chưa tải xong báo giá → không giảm gì, vẫn hiện đủ số tiền", () => {
        expect(coinBreakdown(300000, 1200, undefined)).toEqual({
            coinApplied: 0,
            coinDiscountVnd: 0,
            payableVnd: 300000,
        })
    })

    // Đường tiền: giảm giá không được vượt số tiền đơn, và đơn không bao giờ âm tiền.
    it("trần rộng hơn số tiền đơn vẫn KHÔNG cho ra số tiền âm", () => {
        const generous = quote({ maxApplicableCoin: 5000, maxDiscountVnd: 500000 })
        expect(coinBreakdown(300000, 5000, generous)).toEqual({
            coinApplied: 5000,
            coinDiscountVnd: 300000,
            payableVnd: 0,
        })
    })

    it("số tiền đơn 0đ → không có gì để giảm", () => {
        expect(coinBreakdown(0, 1000, quote())).toEqual({
            coinApplied: 0,
            coinDiscountVnd: 0,
            payableVnd: 0,
        })
    })
})

describe("walletCoversAll", () => {
    it("trả trọn khi mức giảm tối đa phủ hết số tiền phải trả", () => {
        // giảm tối đa 300k ≥ phải trả 200k
        expect(walletCoversAll(quote())).toBe(true)
    })

    it("KHÔNG trả trọn khi mức giảm tối đa thấp hơn số tiền phải trả", () => {
        expect(
            walletCoversAll(
                quote({ maxApplicableCoin: 800, maxDiscountVnd: 80000, payableVnd: 220000 }),
            ),
        ).toBe(false)
    })

    /**
     * Hồi quy: bản đầu đọc `payableVnd` như "còn phải trả SAU khi áp trọn trần" nên viết
     * điều kiện `payableVnd <= 0`. BE trả vào field đó chính số tiền được hỏi, nên điều
     * kiện ấy chỉ đúng với đơn 0đ — tức lựa chọn trả trọn bằng Ví không bao giờ bật.
     */
    it("đơn 0đ thì không có gì để ví trả", () => {
        expect(walletCoversAll(quote({ payableVnd: 0 }))).toBe(false)
    })

    it("không có Xu nào áp được / chưa có báo giá → false", () => {
        expect(walletCoversAll(quote({ maxApplicableCoin: 0, maxDiscountVnd: 0 }))).toBe(false)
        expect(walletCoversAll(undefined)).toBe(false)
    })
})
