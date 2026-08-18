import { describe, expect, it } from "vitest"

import { RestError } from "@/modules/api/rest/client"
import type { SeasonBoardView } from "@/modules/api/rest/gamification"
import {
    SEASON_BOARDS,
    boardOutcome,
    classifyBoardFailure,
    shortUserLabel,
    toSeasonBoardRows,
} from "./model"

/**
 * Unit — mô hình bảng xếp hạng theo kỳ.
 *
 * Thứ đáng ghim ở đây không phải phép ánh xạ mà là BỐN KẾT CỤC KHÔNG ĐƯỢC GỘP: lỗi tải ·
 * chưa khai kỳ nào · kỳ đang chạy nhưng bảng rỗng · có dữ liệu. Backend cấp hẳn một cờ
 * (`state`) chỉ để tách hai cái giữa, và javadoc của `SeasonBoardController` nói thẳng:
 * gộp chúng là nói với người dùng "chưa ai có điểm" trong khi sự thật là "chưa khai kỳ
 * nào". Đó là lỗi đã tái diễn nhiều lần trong dự án này.
 */

const view = (over: Partial<SeasonBoardView> = {}): SeasonBoardView => ({
    state: "OK",
    board: "TOTAL",
    seasonCode: "T2026S1",
    termId: "term-1",
    entries: [],
    myRank: null,
    ...over,
})

describe("SEASON_BOARDS", () => {
    it("chỉ hai bảng backend phục vụ — KHÔNG có `course`", () => {
        // `SeasonBoardController.parseBoard` ném 404 cho mọi giá trị khác total/social;
        // bảng khoá học là GraphQL `courseLeaderboard`, dựng bản thứ hai sẽ đẻ ra hai con
        // số cùng tên gọi.
        expect([...SEASON_BOARDS]).toEqual(["total", "social"])
    })
})

describe("boardOutcome", () => {
    it("state=NO_SEASON KHÔNG được đọc thành bảng rỗng", () => {
        expect(boardOutcome(view({ state: "NO_SEASON", seasonCode: null, termId: null }))).toBe(
            "NO_SEASON",
        )
    })

    it("state=OK + entries rỗng LÀ bảng rỗng thật — câu trả lời đúng", () => {
        expect(boardOutcome(view({ state: "OK", entries: [] }))).toBe("EMPTY")
    })

    it("hai ca trên cho ra hai kết cục KHÁC NHAU (không được gộp)", () => {
        const noSeason = boardOutcome(view({ state: "NO_SEASON", entries: [] }))
        const empty = boardOutcome(view({ state: "OK", entries: [] }))
        expect(noSeason).not.toBe(empty)
    })

    it("có dòng ⇒ OK", () => {
        expect(
            boardOutcome(view({ entries: [{ userId: "u1", xp: 10, rank: 1 }] })),
        ).toBe("OK")
    })

    it("lỗi đi TRƯỚC mọi thứ, kể cả khi còn dữ liệu cache", () => {
        expect(boardOutcome(view({ state: "NO_SEASON" }), new RestError("boom", 500))).toBe(
            "FAILED",
        )
        expect(
            boardOutcome(view({ entries: [{ userId: "u1", xp: 10, rank: 1 }] }), new Error("net")),
        ).toBe("FAILED")
    })
})

describe("classifyBoardFailure", () => {
    it("404/501/405 ⇒ backend chưa có tính năng", () => {
        expect(classifyBoardFailure(new RestError("x", 404))).toBe("NOT_DEPLOYED")
        expect(classifyBoardFailure(new RestError("x", 501))).toBe("NOT_DEPLOYED")
        expect(classifyBoardFailure(new RestError("x", 405))).toBe("NOT_DEPLOYED")
    })

    it("401/403 ⇒ cần đăng nhập / thiếu quyền", () => {
        expect(classifyBoardFailure(new RestError("x", 401))).toBe("UNAUTHENTICATED")
        expect(classifyBoardFailure(new RestError("x", 403))).toBe("UNAUTHENTICATED")
    })

    it("không có lỗi ⇒ null, KHÔNG phải 'không có dữ liệu'", () => {
        expect(classifyBoardFailure(undefined)).toBeNull()
        expect(classifyBoardFailure(null)).toBeNull()
    })
})

describe("toSeasonBoardRows", () => {
    it("giữ nguyên thứ tự + hạng máy chủ trả, đánh dấu dòng của người xem", () => {
        const rows = toSeasonBoardRows(
            view({
                entries: [
                    { userId: "u1", xp: 900, rank: 1 },
                    { userId: "u2", xp: 800, rank: 2 },
                ],
            }),
            "u2",
        )
        expect(rows.map((row) => row.rank)).toEqual([1, 2])
        expect(rows.map((row) => row.isViewer)).toEqual([false, true])
    })
})

describe("shortUserLabel", () => {
    it("mã rút gọn — thứ duy nhất THẬT khi contract backend không mang tên", () => {
        expect(shortUserLabel("7b1e2c44-0a55-4f0a-9a71-9d5a3f2b1c00")).toBe("#7b1e2c44")
    })
})
