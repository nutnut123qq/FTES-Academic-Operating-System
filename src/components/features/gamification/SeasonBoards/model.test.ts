import { describe, expect, it } from "vitest"

/**
 * Unit — mô hình ba bảng xếp hạng theo kì.
 *
 * Điều được GHIM ở đây, theo đúng thứ tự quan trọng:
 *
 *  1. "Máy chủ CHƯA CÓ endpoint" (404/501/405) là một LỖI, không phải bảng rỗng. Đây là
 *     lỗi đã tái diễn ba lần trong dự án: hai trạng thái khác hẳn nhau bị vẽ chung một
 *     màn "chưa có ai", nên không ai biết là BE chưa deploy.
 *  2. Không có kì nào đang chạy ⇒ `seasonCountdown` trả `null`, KHÔNG phải "còn 0 ngày".
 *  3. Hạng giữ nguyên thứ tự máy chủ (hạng tính trên toàn dân số, không sắp lại ở client).
 *  4. Tên `legacy_<uuid>` không bao giờ lọt ra mặt người dùng.
 */

import { RestError } from "@/modules/api/rest/client"
import type { SeasonBoardEntryView, SeasonBoardView } from "@/modules/api/rest/gamification"
import {
    classifyBoardFailure,
    seasonCountdown,
    toSeasonBoardRows,
    xpBreakdown,
} from "./model"

const entry = (over: Partial<SeasonBoardEntryView> = {}): SeasonBoardEntryView => ({
    userId: "11111111-2222-3333-4444-555555555555",
    rank: 1,
    displayName: "Minh Nguyễn",
    username: "minh",
    avatarUrl: null,
    avatarFrame: null,
    xp: 5000,
    courseXp: 3000,
    communityXp: 1500,
    workplaceXp: 500,
    badges: [],
    ...over,
})

describe("classifyBoardFailure — RỖNG không được gộp với LỖI", () => {
    it("không có lỗi ⇒ null (bảng rỗng thật vẫn là rỗng)", () => {
        expect(classifyBoardFailure(undefined)).toBeNull()
        expect(classifyBoardFailure(null)).toBeNull()
        expect(classifyBoardFailure(false)).toBeNull()
    })

    it("404/501/405 ⇒ NOT_DEPLOYED — lane BE chưa merge, phải nói thành lời", () => {
        expect(classifyBoardFailure(new RestError("Not Found", 404))).toBe("NOT_DEPLOYED")
        expect(classifyBoardFailure(new RestError("Not Implemented", 501))).toBe("NOT_DEPLOYED")
        expect(classifyBoardFailure(new RestError("Method Not Allowed", 405))).toBe("NOT_DEPLOYED")
    })

    it("401/403 ⇒ UNAUTHENTICATED", () => {
        expect(classifyBoardFailure(new RestError("Unauthenticated", 401))).toBe("UNAUTHENTICATED")
        expect(classifyBoardFailure(new RestError("Forbidden", 403))).toBe("UNAUTHENTICATED")
    })

    it("5xx / đứt mạng (status 0) / lỗi lạ ⇒ FAILED", () => {
        expect(classifyBoardFailure(new RestError("Server Error", 500))).toBe("FAILED")
        expect(classifyBoardFailure(new RestError("Network Error", 0))).toBe("FAILED")
        expect(classifyBoardFailure(new TypeError("Failed to fetch"))).toBe("FAILED")
    })

    it("★ 404 KHÔNG được rơi về null — nếu rơi, màn hình sẽ vẽ empty và không ai biết BE thiếu", () => {
        expect(classifyBoardFailure(new RestError("Not Found", 404))).not.toBeNull()
    })
})

describe("seasonCountdown", () => {
    const now = new Date("2026-08-18T10:00:00Z")

    it("trả số ngày + giờ lẻ còn lại", () => {
        const countdown = seasonCountdown(
            {
                seasonId: "s-1",
                code: "FA26",
                termName: "Kì Thu 2026",
                startsAt: "2026-08-01T00:00:00Z",
                endsAt: "2026-08-21T15:00:00Z",
                status: "RUNNING",
            },
            now,
        )
        expect(countdown).toEqual({ days: 3, hours: 5, ended: false })
    })

    it("★ KHÔNG có kì ⇒ null, KHÔNG phải 'còn 0 ngày'", () => {
        expect(seasonCountdown(null, now)).toBeNull()
        expect(seasonCountdown(undefined, now)).toBeNull()
    })

    it("endsAt không đọc được ⇒ null (không bịa ra một mốc)", () => {
        expect(
            seasonCountdown(
                {
                    seasonId: "s-1",
                    code: "FA26",
                    termName: null,
                    startsAt: "2026-08-01T00:00:00Z",
                    endsAt: "không-phải-ngày",
                    status: "RUNNING",
                },
                now,
            ),
        ).toBeNull()
    })

    it("kì đã qua hạn ⇒ ended:true (khác hẳn 'không có kì')", () => {
        expect(
            seasonCountdown(
                {
                    seasonId: "s-1",
                    code: "SU26",
                    termName: "Kì Hè 2026",
                    startsAt: "2026-05-01T00:00:00Z",
                    endsAt: "2026-08-01T00:00:00Z",
                    status: "RUNNING",
                },
                now,
            ),
        ).toEqual({ days: 0, hours: 0, ended: true })
    })
})

describe("toSeasonBoardRows", () => {
    const view = (entries: Array<SeasonBoardEntryView>): SeasonBoardView => ({
        board: "total",
        seasonId: "s-1",
        computedAt: "2026-08-18T09:00:00Z",
        entries,
        myRank: null,
    })

    it("giữ NGUYÊN thứ tự máy chủ (hạng tính trên toàn dân số)", () => {
        const rows = toSeasonBoardRows(
            view([
                entry({ userId: "u-1", rank: 7, xp: 100 }),
                entry({ userId: "u-2", rank: 8, xp: 9000 }),
            ]),
        )
        expect(rows.map((row) => row.userId)).toEqual(["u-1", "u-2"])
        expect(rows.map((row) => row.rank)).toEqual([7, 8])
    })

    it("thiếu tên ⇒ rơi về username rồi #id ngắn, không in uuid trần", () => {
        const rows = toSeasonBoardRows(
            view([
                entry({ userId: "u-1", displayName: null, username: "minh" }),
                entry({ userId: "abcdefgh-1111", displayName: null, username: null }),
            ]),
        )
        expect(rows[0].displayName).toBe("minh")
        expect(rows[1].displayName).toBe("#abcdefgh")
    })

    it("★ lọc tên rác legacy_<uuid> ở CẢ displayName lẫn username", () => {
        const [row] = toSeasonBoardRows(
            view([
                entry({
                    userId: "abcdefgh-1111",
                    displayName: "legacy_9f2c",
                    username: "legacy_9f2c",
                }),
            ]),
        )
        expect(row.displayName).toBe("#abcdefgh")
        expect(row.username).toBe("")
    })

    it("đánh dấu đúng dòng của người xem", () => {
        const rows = toSeasonBoardRows(
            view([entry({ userId: "u-1" }), entry({ userId: "u-2" })]),
            "u-2",
        )
        expect(rows.filter((row) => row.isViewer).map((row) => row.userId)).toEqual(["u-2"])
    })

    it("không có dữ liệu ⇒ mảng rỗng (đây MỚI là trạng thái rỗng hợp lệ)", () => {
        expect(toSeasonBoardRows(undefined)).toEqual([])
        expect(toSeasonBoardRows(view([]))).toEqual([])
    })
})

describe("xpBreakdown — ba nguồn là ba LÁT CẮT của một đơn vị EXP", () => {
    it("tách đúng ba nguồn và tổng khớp EXP bảng tổng", () => {
        const [row] = toSeasonBoardRows({
            board: "total",
            seasonId: "s-1",
            computedAt: null,
            entries: [entry()],
            myRank: null,
        })
        const slices = xpBreakdown(row)
        expect(slices.map((slice) => slice.key)).toEqual(["course", "community", "workplace"])
        expect(slices.reduce((sum, slice) => sum + slice.value, 0)).toBe(row.xp)
    })
})
