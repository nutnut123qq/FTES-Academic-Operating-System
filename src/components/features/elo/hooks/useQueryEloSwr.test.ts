import { beforeEach, describe, expect, it, vi } from "vitest"
import { RestError } from "@/modules/api/rest/client"

/**
 * Unit — đường đọc của biểu đồ Elo kỹ năng (`loadEloChart`).
 *
 * GHIM ĐÚNG MỘT SỰ THẬT: **lỗi đọc KHÔNG được hoá trang thành "bạn chưa có Elo"**. Trước bản vá,
 * fetcher gọi `getMyCareerElo().catch(() => [])` — nuốt sạch mọi lỗi thành mảng rỗng, và mảng
 * rỗng thì `buildEloChart` vẽ TOÀN BỘ danh mục ở 0 Elo với `isEmpty = false`. Học viên đang có
 * 1.200 Elo gặp một cú 500 (hoặc timeout) sẽ thấy một biểu đồ đầy số 0 trông y như dữ liệu thật,
 * kèm câu "học và hoàn thành khóa để bắt đầu cộng", và KHÔNG có nút Thử lại. Người ta đọc cảnh đó
 * thành "hệ thống mất sạch Elo của tôi".
 *
 * Ranh giới: 401/403/404 = "không có gì để đọc" (khách / thiếu quyền / BE chưa deploy endpoint) ⇒
 * vẫn vẽ danh mục chung nhưng CÓ CỜ `learnerReadUnavailable`. Mọi mã khác ⇒ ném để SWR bật trạng
 * thái lỗi có nút Thử lại.
 */

const getCareerSkillCategories = vi.fn()
const getMyCareerElo = vi.fn()

vi.mock("@/modules/api/rest/career", () => ({
    getCareerSkillCategories: () => getCareerSkillCategories(),
    getMyCareerElo: () => getMyCareerElo(),
}))

import { isEloReadUnavailable, loadEloChart } from "./useQueryEloSwr"

const CATALOGUE = [
    { slug: "programming", label: "Programming", sortOrder: 1 },
    { slug: "database", label: "Database", sortOrder: 2 },
]

beforeEach(() => {
    getCareerSkillCategories.mockReset()
    getMyCareerElo.mockReset()
    getCareerSkillCategories.mockResolvedValue(CATALOGUE)
})

describe("isEloReadUnavailable", () => {
    it("chỉ dung thứ 401/403/404 — 'không có gì để đọc', không phải hỏng", () => {
        expect(isEloReadUnavailable(new RestError("guest", 401))).toBe(true)
        expect(isEloReadUnavailable(new RestError("forbidden", 403))).toBe(true)
        expect(isEloReadUnavailable(new RestError("chưa deploy", 404))).toBe(true)
    })

    it("KHÔNG dung thứ lỗi hỏng thật (5xx, mạng đứt, lỗi lạ)", () => {
        expect(isEloReadUnavailable(new RestError("boom", 500))).toBe(false)
        expect(isEloReadUnavailable(new RestError("gateway", 502))).toBe(false)
        // status 0 = không có response nào tới nơi (mạng đứt / timeout).
        expect(isEloReadUnavailable(new RestError("network", 0))).toBe(false)
        expect(isEloReadUnavailable(new Error("TypeError: fetch failed"))).toBe(false)
        expect(isEloReadUnavailable(undefined)).toBe(false)
    })
})

describe("loadEloChart", () => {
    /** ĐÂY LÀ BUG ĐANG CHỮA: 500 ở đường đọc học viên phải NỔI LÊN, không hoá thành 0 Elo. */
    it("ném lỗi khi đường đọc Elo học viên hỏng, thay vì vẽ danh mục toàn số 0", async () => {
        getMyCareerElo.mockRejectedValue(new RestError("boom", 500))

        await expect(loadEloChart()).rejects.toBeInstanceOf(RestError)
    })

    it("ném lỗi cả khi mạng đứt (không có response nào)", async () => {
        getMyCareerElo.mockRejectedValue(new RestError("network", 0))

        await expect(loadEloChart()).rejects.toThrow()
    })

    it("khách / thiếu quyền: vẫn vẽ danh mục chung NHƯNG gắn cờ chưa đọc được", async () => {
        getMyCareerElo.mockRejectedValue(new RestError("guest", 401))

        const chart = await loadEloChart()
        expect(chart.bars.map((bar) => bar.slug)).toEqual(["programming", "database"])
        expect(chart.learnerReadUnavailable).toBe(true)
        expect(chart.isEmpty).toBe(false)
    })

    it("đọc được thì KHÔNG gắn cờ — kể cả khi học viên chưa tích được Elo nào", async () => {
        getMyCareerElo.mockResolvedValue({
            majorCode: "SE",
            majorLabel: "Kỹ Thuật Phần Mềm",
            source: "MAJOR_DEFAULTS",
            items: [{ slug: "programming", label: "Programming", sortOrder: 1, totalElo: 0 }],
        })

        const chart = await loadEloChart()
        expect(chart.learnerReadUnavailable).toBe(false)
        expect(chart.hasEarnedElo).toBe(false)
        expect(chart.source).toBe("MAJOR_DEFAULTS")
    })

    /** Danh mục là đường đọc BẮT BUỘC — hỏng thì màn hình phải vào trạng thái lỗi, không im lặng. */
    it("ném lỗi khi đọc danh mục nhóm kỹ năng hỏng", async () => {
        getCareerSkillCategories.mockRejectedValue(new RestError("boom", 500))
        getMyCareerElo.mockResolvedValue({ source: "FULL_CATALOGUE", items: [] })

        await expect(loadEloChart()).rejects.toBeInstanceOf(RestError)
    })
})
