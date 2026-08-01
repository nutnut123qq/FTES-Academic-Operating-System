import { describe, expect, it } from "vitest"
import { resolveAwaitingDeadline } from "./index"

/** Neo dự phòng giả định: 30 phút kể từ một mốc cố định. */
const FALLBACK = Date.parse("2026-07-30T10:30:00Z")

describe("resolveAwaitingDeadline", () => {
    it("bám HẠN THẬT của đơn khi BE trả expiresAt", () => {
        const real = "2026-07-30T10:25:00Z"
        expect(resolveAwaitingDeadline(real, FALLBACK)).toBe(Date.parse(real))
    })

    // Đơn tạo trước change commerce-order-expires-at, hoặc BE chưa deploy.
    it("rơi về neo dự phòng khi đơn không mang expiresAt", () => {
        expect(resolveAwaitingDeadline(undefined, FALLBACK)).toBe(FALLBACK)
    })

    it("rơi về neo dự phòng khi expiresAt là rác, không trả NaN", () => {
        const value = resolveAwaitingDeadline("hôm nào đó", FALLBACK)
        expect(Number.isNaN(value)).toBe(false)
        expect(value).toBe(FALLBACK)
    })

    /**
     * Regression: đồng hồ mount NGAY khi vào pha awaiting còn expiresAt phải đợi vòng poll đầu.
     * Lượt render đầu (chưa có hạn) phải ra neo dự phòng, lượt sau (hạn về) phải ĐỔI sang hạn
     * thật — chốt cứng lúc mount là khoá luôn số đoán, đúng lỗi báo "hết hạn" khi đơn còn sống.
     */
    it("đổi sang hạn thật khi expiresAt về muộn sau lần render đầu", () => {
        const first = resolveAwaitingDeadline(undefined, FALLBACK)
        const later = resolveAwaitingDeadline("2026-07-30T10:45:00Z", FALLBACK)
        expect(first).toBe(FALLBACK)
        expect(later).toBe(Date.parse("2026-07-30T10:45:00Z"))
        expect(later).not.toBe(first)
    })
})
