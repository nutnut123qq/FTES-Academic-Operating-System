import { describe, expect, it } from "vitest"
import { planOrderPhase } from "./planOrderPhase"

describe("planOrderPhase", () => {
    it("giữ trạng thái chờ khi đơn vừa tạo, chưa có vòng poll nào trả lời", () => {
        expect(planOrderPhase(undefined)).toBe("awaiting")
        expect(planOrderPhase(null)).toBe("awaiting")
        expect(planOrderPhase("AWAITING_PAYMENT")).toBe("awaiting")
        expect(planOrderPhase("PENDING")).toBe("awaiting")
    })

    it("coi cả PAID, SUCCESS lẫn FULFILLING là đã trả tiền", () => {
        expect(planOrderPhase("PAID")).toBe("paid")
        expect(planOrderPhase("SUCCESS")).toBe("paid")
        // tiền đã vào, chỉ còn cấp quyền lợi — báo "chưa trả" ở đây là bắt trả lần hai
        expect(planOrderPhase("FULFILLING")).toBe("paid")
    })

    it("tách hết hạn khỏi thất bại (hết hạn không phải lỗi, và còn cứu được)", () => {
        expect(planOrderPhase("EXPIRED")).toBe("expired")
        expect(planOrderPhase("FAILED")).toBe("failed")
        expect(planOrderPhase("CANCELLED")).toBe("failed")
        expect(planOrderPhase("REFUNDED")).toBe("failed")
    })

    it("trạng thái lạ vẫn là chờ, không được báo hỏng", () => {
        expect(planOrderPhase("SOME_NEW_STATUS")).toBe("awaiting")
        expect(planOrderPhase("")).toBe("awaiting")
    })
})
