import { describe, expect, it } from "vitest"

/**
 * Unit — thang khung avatar.
 *
 * Ghim ba điều dễ làm sai:
 *  1. Khung TOP MÙA không được lẫn vào dãy "bậc kế tiếp theo EXP" — nó phải GIÀNH được,
 *     không phải cày EXP là tới. Hứa sai chỗ này là hứa một thứ không tồn tại.
 *  2. `expiresAt === null` là VĨNH VIỄN, không phải "đã hết hạn". Đảo mặc định = tước
 *     khung của mọi người vì một trường máy chủ không gửi.
 *  3. Khung không đo được bằng EXP thì KHÔNG vẽ thanh tiến độ (đúng luật của badge:
 *     `counterKey === null` ⇒ không có thanh nào).
 */

import type { AvatarFrameLadderItemView } from "@/modules/api/rest/gamification"
import {
    frameProgress,
    isFrameExpired,
    lifetimeFrames,
    nextLifetimeFrame,
    seasonTopFrames,
    wornFrame,
} from "./model"

const frame = (over: Partial<AvatarFrameLadderItemView>): AvatarFrameLadderItemView => ({
    code: "MEMBER",
    nameVi: "Thành viên",
    description: null,
    cssGradient: "linear-gradient(135deg,#6366f1,#4f46e5)",
    assetUrl: null,
    kind: "LIFETIME",
    requiredXp: 0,
    board: null,
    topRank: null,
    unlocked: true,
    expiresAt: null,
    ...over,
})

const ladder: Array<AvatarFrameLadderItemView> = [
    frame({ code: "GOLD", requiredXp: 200_000, unlocked: false }),
    frame({ code: "MEMBER", requiredXp: 0, unlocked: true }),
    frame({ code: "SILVER", requiredXp: 50_000, unlocked: false }),
    frame({ code: "BRONZE", requiredXp: 10_000, unlocked: true }),
    frame({
        code: "TOP1_TOTAL",
        kind: "SEASON_TOP",
        requiredXp: null,
        board: "total",
        topRank: 1,
        unlocked: false,
        expiresAt: "2026-12-31T00:00:00Z",
    }),
    frame({
        code: "TOP1_COURSE",
        kind: "SEASON_TOP",
        requiredXp: null,
        board: "course",
        topRank: 1,
        unlocked: true,
        expiresAt: "2026-12-31T00:00:00Z",
    }),
]

describe("lifetimeFrames / seasonTopFrames", () => {
    it("bậc trọn đời sắp theo mốc EXP tăng dần", () => {
        expect(lifetimeFrames(ladder).map((item) => item.code)).toEqual([
            "MEMBER",
            "BRONZE",
            "SILVER",
            "GOLD",
        ])
    })

    it("khung top mùa tách riêng, nhóm theo bảng rồi theo hạng", () => {
        expect(seasonTopFrames(ladder).map((item) => item.code)).toEqual([
            "TOP1_COURSE",
            "TOP1_TOTAL",
        ])
    })

    it("★ hai loại KHÔNG trộn vào nhau", () => {
        expect(lifetimeFrames(ladder).some((item) => item.kind === "SEASON_TOP")).toBe(false)
        expect(seasonTopFrames(ladder).some((item) => item.kind === "LIFETIME")).toBe(false)
    })
})

describe("nextLifetimeFrame", () => {
    it("trả bậc chưa mở gần nhất + số EXP còn thiếu", () => {
        expect(nextLifetimeFrame(ladder, 12_000)).toEqual({
            frame: expect.objectContaining({ code: "SILVER" }),
            remainingXp: 38_000,
        })
    })

    it("★ không bao giờ trả khung TOP MÙA (khung đó phải giành, không cày EXP mà tới)", () => {
        const onlySeasonTop = ladder.filter((item) => item.kind === "SEASON_TOP")
        expect(nextLifetimeFrame(onlySeasonTop, 0)).toBeNull()
    })

    it("đã mở hết bậc trọn đời ⇒ null (người gọi nói 'bậc cao nhất', không vẽ thanh rỗng)", () => {
        const maxed = lifetimeFrames(ladder).map((item) => ({ ...item, unlocked: true }))
        expect(nextLifetimeFrame(maxed, 999_999)).toBeNull()
    })
})

describe("frameProgress", () => {
    it("bậc EXP ⇒ tiến độ bị kẹp trong [0, mốc]", () => {
        const silver = frame({ code: "SILVER", requiredXp: 50_000, unlocked: false })
        expect(frameProgress(silver, 12_000)).toEqual({ value: 12_000, max: 50_000 })
        expect(frameProgress(silver, 99_999)).toEqual({ value: 50_000, max: 50_000 })
    })

    it("★ khung top mùa / mốc 0 ⇒ null, KHÔNG vẽ thanh nào", () => {
        expect(
            frameProgress(frame({ kind: "SEASON_TOP", requiredXp: null, topRank: 1 }), 1_000),
        ).toBeNull()
        expect(frameProgress(frame({ code: "MEMBER", requiredXp: 0 }), 1_000)).toBeNull()
    })
})

describe("isFrameExpired", () => {
    const now = new Date("2026-08-18T10:00:00Z")

    it("★ expiresAt null ⇒ VĨNH VIỄN, chưa hết hạn", () => {
        expect(isFrameExpired(frame({ expiresAt: null }), now)).toBe(false)
    })

    it("hạn đã qua ⇒ hết hạn; hạn còn ⇒ chưa", () => {
        expect(isFrameExpired(frame({ expiresAt: "2026-08-01T00:00:00Z" }), now)).toBe(true)
        expect(isFrameExpired(frame({ expiresAt: "2026-12-31T00:00:00Z" }), now)).toBe(false)
    })
})

describe("wornFrame", () => {
    it("trả đúng khung đang đeo theo currentCode", () => {
        expect(wornFrame({ lifetimeXp: 12_000, currentCode: "BRONZE", items: ladder })?.code).toBe(
            "BRONZE",
        )
    })

    it("chưa đeo khung nào / mã trỏ vào khung không còn ⇒ null", () => {
        expect(wornFrame({ lifetimeXp: 0, currentCode: null, items: ladder })).toBeNull()
        expect(wornFrame({ lifetimeXp: 0, currentCode: "KHONG_TON_TAI", items: ladder })).toBeNull()
        expect(wornFrame(undefined)).toBeNull()
    })
})
