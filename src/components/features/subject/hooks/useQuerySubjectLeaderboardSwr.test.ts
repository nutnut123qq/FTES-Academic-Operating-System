import { describe, expect, it, vi } from "vitest"

/**
 * Unit — the subject leaderboard mapping.
 *
 * The tab used to render nothing at all (the hook resolved a hard-coded `[]`).
 * Now it maps `GET /subjects/{code}/statistics → leaderboard[{userId,score,rank}]`,
 * so the contract pinned here is: score becomes the ranked value, rows come back
 * ordered by the BE rank (a renderer deriving position from the array index stays
 * correct), names join in from the member list, and the missing per-category XP
 * facet degrades to zeros instead of being fabricated.
 */

// The hook module reaches for the redux store + REST client at import time.
vi.mock("@/redux/hooks", () => ({ useAppSelector: () => undefined }))
vi.mock("@/modules/api/rest/subject/subject", () => ({
    getSubjectStatistics: vi.fn(),
    getSubjectMembers: vi.fn(),
}))

import { mapSubjectLeaderboard } from "./useQuerySubjectLeaderboardSwr"

const statistics = {
    leaderboard: [
        { userId: "u-2", score: 80, rank: 2 },
        { userId: "u-1", score: 120, rank: 1 },
        { userId: "u-3", score: 40, rank: 3 },
    ],
}

const members = [
    {
        userId: "u-1",
        role: "STUDENT",
        joinedAt: "2026-01-01T00:00:00Z",
        username: "minh",
        displayName: "Minh Nguyễn",
        avatarUrl: "https://cdn/minh.png",
    },
]

describe("mapSubjectLeaderboard", () => {
    it("maps score → totalXp and sorts by the BE rank", () => {
        const entries = mapSubjectLeaderboard(statistics, members)

        expect(entries.map((entry) => entry.id)).toEqual(["u-1", "u-2", "u-3"])
        expect(entries.map((entry) => entry.rank)).toEqual([1, 2, 3])
        expect(entries.map((entry) => entry.totalXp)).toEqual([120, 80, 40])
    })

    it("degrades the missing XP breakdown to zeros", () => {
        const [top] = mapSubjectLeaderboard(statistics, members)

        expect(top.challengeXp).toBe(0)
        expect(top.readingXp).toBe(0)
        expect(top.milestoneXp).toBe(0)
    })

    it("joins the member display name / avatar, and falls back to a short handle", () => {
        const entries = mapSubjectLeaderboard(statistics, members)

        expect(entries[0].username).toBe("Minh Nguyễn")
        expect(entries[0].avatar).toBe("https://cdn/minh.png")
        // no member row for u-2 → short handle, never a raw UUID
        expect(entries[1].username).toBe("#u-2")
        expect(entries[1].avatar).toBeNull()
    })

    it("flags the viewer's own row", () => {
        const entries = mapSubjectLeaderboard(statistics, members, "u-3")

        expect(entries.filter((entry) => entry.isViewer).map((entry) => entry.id)).toEqual(["u-3"])
    })

    it("returns an empty board when the BE sends no leaderboard", () => {
        expect(mapSubjectLeaderboard(null)).toEqual([])
        expect(mapSubjectLeaderboard({ leaderboard: [] })).toEqual([])
    })
})
