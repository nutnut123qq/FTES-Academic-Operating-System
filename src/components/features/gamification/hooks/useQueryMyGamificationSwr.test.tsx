import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — `useQueryMyGamificationSwr` (task 4.1) composes the live REST
 * gamification hooks into the ONE `MyGamification` snapshot the account dropdown
 * and profile progress read. The individual REST hooks + the leaderboard hook are
 * mocked so this pins the composition contract without a backend:
 *  - guests get `data === undefined` (no snapshot),
 *  - progression is the primary slice — no progression ⇒ no snapshot,
 *  - XP / level / level-progress come from progression (`nextThreshold` = the
 *    next-level threshold, clamped to total XP at max level),
 *  - streak days keep only activity days with XP > 0,
 *  - rank position is the viewer's 1-based index on the real board,
 *  - badges map `code → {id, badgeKey}` and slice `awardedAt` to a yyyy-mm-dd date,
 *    carrying the badge ART (`iconUrl`) and `kind` through so the surfaces that
 *    paint a badge draw the real emblem instead of a hardcoded trophy.
 */

let authenticated = false
vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: { keycloak: { authenticated: boolean } }) => unknown) =>
        selector({ keycloak: { authenticated } }),
}))

let progression: unknown
let streak: unknown
let activity: unknown
let badges: unknown
vi.mock("@/hooks/swr/api/rest/queries/useGetMyProgressionSwr", () => ({
    useGetMyProgressionSwr: () => ({ data: progression, isLoading: false, error: undefined }),
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetMyStreakSwr", () => ({
    useGetMyStreakSwr: () => ({ data: streak, isLoading: false, error: undefined }),
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetMyActivityDaysSwr", () => ({
    useGetMyActivityDaysSwr: () => ({ data: activity, isLoading: false, error: undefined }),
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetMyBadgesSwr", () => ({
    useGetMyBadgesSwr: () => ({ data: badges, isLoading: false, error: undefined }),
}))

let board: Array<{ id: string }> = []
let myUserId: string | null = null
vi.mock("./useQueryLeaderboardSwr", () => ({
    useQueryLeaderboardSwr: () => ({ board, myUserId }),
}))

import { useQueryMyGamificationSwr } from "./useQueryMyGamificationSwr"

beforeEach(() => {
    authenticated = false
    progression = undefined
    streak = undefined
    activity = undefined
    badges = undefined
    board = []
    myUserId = null
})

describe("useQueryMyGamificationSwr", () => {
    it("returns no snapshot for a guest", () => {
        authenticated = false
        progression = { totalXp: 100, level: 2, levelTitle: "", nextLevelXp: 140, reputation: 0 }
        const { result } = renderHook(() => useQueryMyGamificationSwr())
        expect(result.current.data).toBeUndefined()
    })

    it("returns no snapshot until progression (the primary slice) has loaded", () => {
        authenticated = true
        progression = undefined
        streak = { currentStreak: 3, longestStreak: 5, lastActiveDate: null, freezeAvailable: 0 }
        const { result } = renderHook(() => useQueryMyGamificationSwr())
        expect(result.current.data).toBeUndefined()
    })

    it("composes xp / level / level-progress / streak / rank / badges from the live slices", () => {
        authenticated = true
        progression = { totalXp: 1500, level: 5, levelTitle: "Gold", nextLevelXp: 1760, reputation: 12 }
        streak = { currentStreak: 7, longestStreak: 9, lastActiveDate: "2026-07-16", freezeAvailable: 1 }
        activity = {
            weeks: 12,
            days: [
                { date: "2026-07-14", xp: 20 },
                { date: "2026-07-15", xp: 0 },
                { date: "2026-07-16", xp: 50 },
            ],
        }
        badges = [
            {
                code: "WEEK_OF_FIRE",
                kind: "STREAK",
                name: "Tuần Lửa",
                awardedAt: "2026-07-10T08:30:00Z",
                iconUrl: "https://cdn.example/week-of-fire.png",
            },
        ]
        board = [{ id: "u1" }, { id: "me" }, { id: "u3" }]
        myUserId = "me"

        const { result } = renderHook(() => useQueryMyGamificationSwr())
        const data = result.current.data
        expect(data).toBeDefined()
        expect(data?.xp).toBe(1500)
        expect(data?.level).toBe(5)
        // level-progress uses total XP against the next-level threshold
        expect(data?.levelProgress).toEqual({ current: 1500, nextThreshold: 1760 })
        expect(data?.streak.current).toBe(7)
        // only days with XP > 0 count as active
        expect(data?.streak.days).toEqual(["2026-07-14", "2026-07-16"])
        // 1-based board index of the viewer
        expect(data?.rank.position).toBe(2)
        // 1500 XP → gold tier (rules.ts RANK_TIERS)
        expect(data?.rank.league).toBe("gold")
        expect(data?.badges).toEqual([
            {
                id: "WEEK_OF_FIRE",
                badgeKey: "WEEK_OF_FIRE",
                earnedDate: "2026-07-10",
                fallbackName: "Tuần Lửa",
                kind: "STREAK",
                iconUrl: "https://cdn.example/week-of-fire.png",
            },
        ])
    })

    it("keeps the badge art as null when the backend says the badge has none", () => {
        authenticated = true
        progression = { totalXp: 10, level: 1, levelTitle: "", nextLevelXp: 40, reputation: 0 }
        badges = [
            { code: "FIRST_POST", kind: "BADGE", name: "Bài đầu tiên", awardedAt: "2026-07-10T08:30:00Z", iconUrl: null },
        ]
        const { result } = renderHook(() => useQueryMyGamificationSwr())
        expect(result.current.data?.badges[0]?.iconUrl).toBeNull()
    })

    it("normalises a MISSING art field (backend not deployed yet) to null, never undefined", () => {
        authenticated = true
        progression = { totalXp: 10, level: 1, levelTitle: "", nextLevelXp: 40, reputation: 0 }
        // Exactly the payload the CURRENT backend returns: no `iconUrl` key at all.
        badges = [
            { code: "FIRST_COMMENT", kind: "BADGE", name: "Bình luận đầu tiên", awardedAt: "2026-07-10T08:30:00Z" },
        ]
        const { result } = renderHook(() => useQueryMyGamificationSwr())
        const badge = result.current.data?.badges[0]
        expect(badge?.iconUrl).toBeNull()
        // `kind` still rides along — it is what picks the fallback glyph.
        expect(badge?.kind).toBe("BADGE")
    })

    it("clamps the level threshold to total XP at the max level (nextLevelXp null)", () => {
        authenticated = true
        progression = { totalXp: 9000, level: 20, levelTitle: "Max", nextLevelXp: null, reputation: 0 }
        const { result } = renderHook(() => useQueryMyGamificationSwr())
        expect(result.current.data?.levelProgress).toEqual({ current: 9000, nextThreshold: 9000 })
    })

    it("reports the viewer as unranked (position 0) when the board is empty", () => {
        authenticated = true
        progression = { totalXp: 100, level: 2, levelTitle: "", nextLevelXp: 140, reputation: 0 }
        board = []
        myUserId = "me"
        const { result } = renderHook(() => useQueryMyGamificationSwr())
        expect(result.current.data?.rank.position).toBe(0)
    })
})
