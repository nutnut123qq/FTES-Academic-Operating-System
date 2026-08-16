import { describe, expect, it } from "vitest"
import { RestError } from "@/modules/api/rest/client"
import { PlanCheckoutError, planCheckoutFailure, planTicketOf } from "./planCheckout"

describe("planTicketOf", () => {
    it("nhận đơn thường: có mã đơn + có QR để quét", () => {
        const ticket = planTicketOf({
            orderId: "ord-1",
            amount: 99000,
            qrCode: "00020101",
            status: "AWAITING_PAYMENT",
        })
        expect(ticket).toEqual({
            orderId: "ord-1",
            qrCode: "00020101",
            amount: 99000,
            coinApplied: 0,
            coinDiscountVnd: 0,
        })
    })

    it("nhận đơn Xu phủ trọn: KHÔNG có QR nhưng đã PAID (backend cố tình không dựng QR 0đ)", () => {
        const ticket = planTicketOf({
            orderId: "ord-2",
            amount: 0,
            status: "PAID",
            coinApplied: 990,
            coinDiscountVnd: 99000,
        })
        expect(ticket?.orderId).toBe("ord-2")
        expect(ticket?.qrCode).toBe("")
        expect(ticket?.amount).toBe(0)
        expect(ticket?.coinApplied).toBe(990)
    })

    it("từ chối đơn chưa trả tiền mà không có QR — người mua không có đường nào để trả", () => {
        expect(planTicketOf({ orderId: "ord-3", amount: 99000, status: "AWAITING_PAYMENT" })).toBeNull()
        // đơn cũ đã chết trả về theo idempotency: cũng không dùng được
        expect(planTicketOf({ orderId: "ord-4", amount: 0, status: "FAILED" })).toBeNull()
    })

    it("không có mã đơn thì không có gì để theo dõi", () => {
        expect(planTicketOf(null)).toBeNull()
        expect(planTicketOf(undefined)).toBeNull()
        expect(planTicketOf({ orderId: "", qrCode: "x", status: "AWAITING_PAYMENT" })).toBeNull()
    })

    it("số Xu lấy theo backend, thiếu trường thì coi như không dùng Xu", () => {
        const ticket = planTicketOf({ orderId: "ord-5", amount: 50000, qrCode: "qr", status: "PENDING" })
        expect(ticket?.coinApplied).toBe(0)
        expect(ticket?.coinDiscountVnd).toBe(0)
    })
})

describe("planCheckoutFailure", () => {
    it("dịch riêng hai mã người mua tự xử lý được", () => {
        expect(planCheckoutFailure(new RestError("quá tay", 422, "COMMERCE_INSUFFICIENT_COIN")))
            .toBe("insufficientCoin")
        expect(planCheckoutFailure(new RestError("sai cổng", 400, "COMMERCE_UNSUPPORTED_PAY_METHOD")))
            .toBe("coinNotSupported")
    })

    it("giữ nguyên mã do chính luồng mua gói dựng ra", () => {
        expect(planCheckoutFailure(new PlanCheckoutError("notOnSale"))).toBe("notOnSale")
        expect(planCheckoutFailure(new PlanCheckoutError("priceChanged"))).toBe("priceChanged")
    })

    it("mọi thứ khác về generic — đoán bừa nguyên nhân trên đường tiền còn tệ hơn", () => {
        expect(planCheckoutFailure(new RestError("hết hàng", 409, "COMMERCE_PRODUCT_OUT_OF_STOCK")))
            .toBe("generic")
        expect(planCheckoutFailure(new RestError("mạng đứt", 0))).toBe("generic")
        expect(planCheckoutFailure(new Error("boom"))).toBe("generic")
        expect(planCheckoutFailure(undefined)).toBe("generic")
    })
})
