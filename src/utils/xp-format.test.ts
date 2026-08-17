import { describe, expect, it } from "vitest"

import { formatXpShort } from "./xp-format"

/**
 * Unit — rút gọn XP theo quy ước VIỆT.
 *
 * Hai tính chất mang cả tính năng, và cả hai đều vô hình trên ảnh chụp màn hình:
 *  1. phần lẻ đứng SAU đơn vị ("1k3"), không phải trước ("1.3k");
 *  2. LÀM TRÒN XUỐNG tuyệt đối — con số hiện ra không bao giờ lớn hơn XP thật. Đây là
 *     ràng buộc về sự thật, không phải về thẩm mỹ: bảng xếp hạng có phần thưởng thật,
 *     nên "2k" cho một người có 1.999 XP là hứa suông.
 */
describe("formatXpShort", () => {
    it("dưới 1.000 thì giữ nguyên — không có đơn vị nào để rút", () => {
        expect(formatXpShort(0)).toBe("0")
        expect(formatXpShort(1)).toBe("1")
        expect(formatXpShort(999)).toBe("999")
    })

    it("mốc nghìn tròn bỏ phần lẻ", () => {
        expect(formatXpShort(1_000)).toBe("1k")
        expect(formatXpShort(10_000)).toBe("10k")
        expect(formatXpShort(100_000)).toBe("100k")
    })

    it("phần lẻ đứng SAU đơn vị (1k3), KHÔNG phải 1.3k", () => {
        expect(formatXpShort(1_300)).toBe("1k3")
        expect(formatXpShort(1_200_000)).toBe("1m2")
    })

    it("làm tròn XUỐNG: 1.999 là 1k9, tuyệt đối không phải 2k", () => {
        expect(formatXpShort(1_999)).toBe("1k9")
        expect(formatXpShort(999_999)).toBe("999k9")
        // 1.050 chưa đủ một phần mười nghìn ⇒ phần lẻ biến mất, KHÔNG lên "1k1".
        expect(formatXpShort(1_050)).toBe("1k")
        expect(formatXpShort(1_099)).toBe("1k")
        expect(formatXpShort(1_100)).toBe("1k1")
    })

    it("triệu: đổi đơn vị đúng chỗ, không kẹt ở nghìn", () => {
        expect(formatXpShort(1_000_000)).toBe("1m")
        expect(formatXpShort(999_999_999)).toBe("999m9")
    })

    it("số lẻ bị sàn trước khi rút — 999,9 vẫn chưa chạm mốc 1k", () => {
        expect(formatXpShort(999.9)).toBe("999")
        expect(formatXpShort(1_999.9)).toBe("1k9")
    })

    it("số âm cũng làm tròn xuống: khoản trừ không được trông nhẹ hơn thật", () => {
        expect(formatXpShort(-1)).toBe("-1")
        expect(formatXpShort(-999)).toBe("-999")
        expect(formatXpShort(-1_000)).toBe("-1k")
        expect(formatXpShort(-1_300)).toBe("-1k3")
        // −1.350 hiện "−1k4" (= −1.400 ≤ −1.350). "−1k3" sẽ là nói khoản trừ nhỏ hơn thật.
        expect(formatXpShort(-1_350)).toBe("-1k4")
        expect(formatXpShort(-1_200_000)).toBe("-1m2")
    })

    it("giá trị không phải số hữu hạn ⇒ gạch ngang, không in NaNk", () => {
        expect(formatXpShort(Number.NaN)).toBe("—")
        expect(formatXpShort(Number.POSITIVE_INFINITY)).toBe("—")
    })
})
