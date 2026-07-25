import React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { SWRConfig } from "swr"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — the subject statistics mapping (`GET /subjects/{code}/statistics`).
 *
 * The tab used to render hand-rolled mock numbers. It now maps the real
 * `StatisticsView`, so the contract pinned here is: counters + completion rate
 * come through untouched (a missing rate stays `null`, NOT 0%), the id-only rows
 * (top students · contributors · leaderboard) resolve their identity from the
 * member list and NEVER fabricate a name, popular resources keep their real UUID
 * (the row links to `/resources/{id}`) and pick up a title when one resolves, and
 * a freshly created subject reports `isEmpty` for the empty state.
 */

// The hook module reaches for the redux store + REST clients at import time.
vi.mock("@/redux/hooks", () => ({ useAppSelector: () => undefined }))
vi.mock("@/modules/api/rest/subject/subject", () => ({
    getSubjectStatistics: vi.fn(),
    getSubjectMembers: vi.fn(),
}))
vi.mock("@/modules/api/rest/resource", () => ({ getResourceDetail: vi.fn() }))

import { getResourceDetail } from "@/modules/api/rest/resource"
import {
    getSubjectMembers,
    getSubjectStatistics,
} from "@/modules/api/rest/subject/subject"
import { mapSubjectStatistics, useQuerySubjectStatsSwr } from "./useQuerySubjectStatsSwr"
import type { MemberView, StatisticsView } from "@/modules/api/rest/subject/types"

const statistics: StatisticsView = {
    topStudents: [
        { userId: "u-2", xp: 80, rank: 2 },
        { userId: "u-1", xp: 120, rank: 1 },
    ],
    topContributors: [{ userId: "u-1", contributions: 7 }],
    popularResources: [
        { resourceId: "aabbccdd-1111-2222-3333-444455556666", views: 42, downloads: 9 },
        { resourceId: "ffeeddcc-1111-2222-3333-444455556666", views: 5, downloads: 0 },
    ],
    completionRate: 63.5,
    memberCount: 12,
    postCount: 4,
    resourceCount: 3,
    leaderboard: [
        { userId: "u-3", score: 40, rank: 3 },
        { userId: "u-1", score: 120, rank: 1 },
    ],
    computedAt: "2026-07-25T08:00:00Z",
}

const members: Array<MemberView> = [
    {
        userId: "u-1",
        role: "STUDENT",
        joinedAt: "2026-01-01T00:00:00Z",
        username: "minh",
        displayName: "Minh Nguyễn",
        avatarUrl: "https://cdn/minh.png",
    },
]

const resources = [{ id: "aabbccdd-1111-2222-3333-444455556666", title: "Slide chương 1" }]

/** A subject whose worker has not computed a snapshot yet (BE answers all-empty). */
const emptyStatistics: StatisticsView = {
    topStudents: [],
    topContributors: [],
    popularResources: [],
    completionRate: null,
    memberCount: 0,
    postCount: 0,
    resourceCount: 0,
    leaderboard: [],
    computedAt: null,
}

describe("mapSubjectStatistics", () => {
    it("carries the snapshot counters, the percent completion rate and computedAt", () => {
        const stats = mapSubjectStatistics(statistics, members, resources)

        expect(stats.memberCount).toBe(12)
        expect(stats.postCount).toBe(4)
        expect(stats.resourceCount).toBe(3)
        expect(stats.completionRate).toBe(63.5)
        expect(stats.computedAt).toBe("2026-07-25T08:00:00Z")
        expect(stats.isEmpty).toBe(false)
    })

    it("sorts the ranked boards by the BE rank", () => {
        const stats = mapSubjectStatistics(statistics, members, resources)

        expect(stats.topStudents.map((student) => student.user.id)).toEqual(["u-1", "u-2"])
        expect(stats.topStudents.map((student) => student.xp)).toEqual([120, 80])
        expect(stats.leaderboard.map((row) => row.rank)).toEqual([1, 3])
    })

    it("joins the member identity and never fabricates a name for unresolved users", () => {
        const stats = mapSubjectStatistics(statistics, members, resources)
        const [first, second] = stats.topStudents

        expect(first.user.username).toBe("minh")
        expect(first.user.displayName).toBe("Minh Nguyễn")
        expect(first.user.avatar).toBe("https://cdn/minh.png")

        // no member row → identity stays id-only (the renderer labels it "#u")
        expect(second.user.username).toBeNull()
        expect(second.user.displayName).toBeNull()
        expect(second.user.shortId).toBe("u")
    })

    it("flags the viewer's own rows", () => {
        const stats = mapSubjectStatistics(statistics, members, resources, "u-1")

        expect(stats.topStudents[0].user.isViewer).toBe(true)
        expect(stats.topStudents[1].user.isViewer).toBe(false)
        expect(stats.topContributors[0].user.isViewer).toBe(true)
    })

    it("keeps the real resource id and joins the title when one resolves", () => {
        const stats = mapSubjectStatistics(statistics, members, resources)
        const [resolved, unresolved] = stats.popularResources

        expect(resolved.id).toBe("aabbccdd-1111-2222-3333-444455556666")
        expect(resolved.title).toBe("Slide chương 1")
        expect(resolved.views).toBe(42)
        expect(resolved.downloads).toBe(9)

        expect(unresolved.title).toBeNull()
        expect(unresolved.shortId).toBe("ffeeddcc")
    })

    it("reports isEmpty for a subject with no snapshot yet — and keeps a missing rate null", () => {
        const stats = mapSubjectStatistics(emptyStatistics, [], [])

        expect(stats.isEmpty).toBe(true)
        expect(stats.completionRate).toBeNull()
        expect(stats.topStudents).toEqual([])
        expect(stats.topContributors).toEqual([])
        expect(stats.popularResources).toEqual([])
        expect(stats.leaderboard).toEqual([])
        expect(stats.computedAt).toBeNull()
    })

    it("is not empty once any single figure lands", () => {
        const stats = mapSubjectStatistics({ ...emptyStatistics, memberCount: 1 }, [], [])

        expect(stats.isEmpty).toBe(false)
        expect(stats.completionRate).toBeNull()
    })

    it("tolerates a missing payload", () => {
        const stats = mapSubjectStatistics(null)

        expect(stats.isEmpty).toBe(true)
        expect(stats.memberCount).toBe(0)
    })

    it("stamps the subject code the figures were read for", () => {
        expect(mapSubjectStatistics(statistics, members, resources, null, "PRF192").code).toBe(
            "PRF192",
        )
    })
})

describe("useQuerySubjectStatsSwr", () => {
    /** Isolated SWR cache per render so one test never serves another's entry. */
    const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(
            SWRConfig,
            { value: { provider: () => new Map(), dedupingInterval: 0 } },
            children,
        )

    beforeEach(() => {
        vi.mocked(getSubjectMembers).mockResolvedValue({ items: [] } as never)
        vi.mocked(getResourceDetail).mockResolvedValue({} as never)
    })

    it("never serves another subject's cached figures when the new read fails", async () => {
        vi.mocked(getSubjectStatistics).mockResolvedValueOnce(statistics)

        const { result, rerender } = renderHook(
            ({ code }: { code: string }) => useQuerySubjectStatsSwr(code),
            { initialProps: { code: "AAA111" }, wrapper },
        )
        await waitFor(() => expect(result.current.stats?.memberCount).toBe(12))

        // keepPreviousData holds AAA111's entry while BBB222 loads — and keeps holding it
        // when that load fails, which used to render AAA111's board under BBB222.
        vi.mocked(getSubjectStatistics).mockRejectedValue(new Error("boom"))
        rerender({ code: "BBB222" })

        await waitFor(() => expect(result.current.error).toBeTruthy())
        expect(result.current.stats).toBeUndefined()
    })

    it("keeps the figures across a key change that only swaps the viewer", async () => {
        vi.mocked(getSubjectStatistics).mockResolvedValue(statistics)

        const { result, rerender } = renderHook(
            ({ code }: { code: string }) => useQuerySubjectStatsSwr(code),
            { initialProps: { code: "AAA111" }, wrapper },
        )
        await waitFor(() => expect(result.current.stats?.code).toBe("AAA111"))

        // same subject, lower-cased route segment → same upper-cased key, no flicker
        rerender({ code: "aaa111" })
        expect(result.current.stats?.memberCount).toBe(12)
    })
})
