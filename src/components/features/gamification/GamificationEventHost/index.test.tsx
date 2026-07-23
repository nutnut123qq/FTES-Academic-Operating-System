import React from "react"
import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ProgressionView, QuestBoardView, QuestItemView } from "@/modules/api/rest/gamification"

/**
 * Component — {@link GamificationEventHost} (task 5.2/5.4), the diff-based feedback
 * host that replaced the removed mock engine. It has NO engine/rules import; it
 * derives feedback purely by diffing the shared SWR caches:
 *  - a quest's `completedCount` growing beyond the last-seen value fires exactly
 *    one "+{coin} — {title}" toast (the FIRST fetch only seeds the baseline, so a
 *    freshly loaded board never toasts its historical completions),
 *  - the progression `level` growing beyond the last-seen value opens the
 *    level-up moment (again, the first fetch seeds silently).
 *
 * The heavy primitives (HeroUI toast/Modal/Typography, phosphor) are mocked so
 * the test pins THIS host's diff logic. `t` echoes key + interpolation values so
 * the toast payload (coin + title) is assertable.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key} ${JSON.stringify(values)}` : key,
}))

const toastSuccess = vi.fn()
vi.mock("@heroui/react", () => ({
    toast: { success: (...args: Array<unknown>) => toastSuccess(...args) },
    // Modal renders its subtree only when open — mirrors the real dialog gating so
    // the level-up body (guarded on `level !== null`) is a reliable "moment" probe.
    Modal: Object.assign(
        ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
            isOpen ? <div data-testid="moment">{children}</div> : null,
        {
            Backdrop: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
            Container: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
            Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
            CloseTrigger: () => <button type="button">close</button>,
            Body: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        },
    ),
    Typography: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@phosphor-icons/react", () => ({ StarIcon: () => <span /> }))

// The level-up moment now cheers with the mascot; stub it so this test stays
// pinned to the diff logic (and doesn't need the real HeroUI `cn`).
vi.mock("@/components/reuseable/FtesMascot", () => ({ FtesMascot: () => <span /> }))

// The two shared SWR caches the host diffs — controllable per render.
let questsData: QuestBoardView | undefined
let progressionData: ProgressionView | undefined
vi.mock("@/hooks/swr/api/rest/queries/useGetMyQuestsSwr", () => ({
    useGetMyQuestsSwr: () => ({ data: questsData }),
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetMyProgressionSwr", () => ({
    useGetMyProgressionSwr: () => ({ data: progressionData }),
}))

import { GamificationEventHost } from "./index"

/** Build a quest board with one quest at a given claimed count. */
const board = (completedCount: number, over: Partial<QuestItemView> = {}): QuestBoardView => ({
    dateVn: "2026-07-16",
    totalCoinToday: 0,
    quests: [
        {
            code: "LESSON_COMPLETE",
            title: "Hoàn thành 1 bài học",
            description: null,
            rewardCoin: 50,
            targetCount: 1,
            dailyLimit: 3,
            eventCount: 0,
            completedCount,
            coinEarnedToday: 0,
            sortOrder: 1,
            ...over,
        },
    ],
})

const progression = (level: number): ProgressionView => ({
    totalXp: 100 * level,
    level,
    levelTitle: "Tập sự",
    nextLevelXp: 100 * (level + 1),
    reputation: 0,
})

beforeEach(() => {
    questsData = undefined
    progressionData = undefined
    toastSuccess.mockClear()
})
afterEach(() => vi.clearAllMocks())

describe("GamificationEventHost", () => {
    it("does not toast on the first quest fetch (seeds the baseline)", () => {
        questsData = board(2)
        render(<GamificationEventHost />)
        expect(toastSuccess).not.toHaveBeenCalled()
    })

    it("toasts once with coin + title when a quest's completed count grows", () => {
        questsData = board(1)
        const { rerender } = render(<GamificationEventHost />)
        expect(toastSuccess).not.toHaveBeenCalled()

        // A later poll shows one more claim → exactly one toast, carrying reward + title.
        questsData = board(2)
        rerender(<GamificationEventHost />)
        expect(toastSuccess).toHaveBeenCalledTimes(1)
        const arg = String(toastSuccess.mock.calls[0][0])
        expect(arg).toContain("quests.toast.questDone")
        expect(arg).toContain("50")
        expect(arg).toContain("Hoàn thành 1 bài học")

        // Same count on the next poll → no further toast.
        questsData = board(2)
        rerender(<GamificationEventHost />)
        expect(toastSuccess).toHaveBeenCalledTimes(1)
    })

    it("credits every newly-claimed lượt when the count jumps by >1 between polls", () => {
        questsData = board(0)
        const { rerender } = render(<GamificationEventHost />)

        // Two comments landed in one 60s window (dailyLimit 3) → +2 × 50 = 100 xu.
        questsData = board(2)
        rerender(<GamificationEventHost />)
        expect(toastSuccess).toHaveBeenCalledTimes(1)
        expect(String(toastSuccess.mock.calls[0][0])).toContain("100")
    })

    it("reseeds after a cache flush (sign-out) instead of raising phantom toasts", () => {
        // User A's board, baseline seeded.
        questsData = board(2)
        const { rerender } = render(<GamificationEventHost />)

        // Sign-out flushes the shared cache to undefined.
        questsData = undefined
        rerender(<GamificationEventHost />)

        // User B signs in on the same tab with a higher count — must NOT toast
        // (the baseline was dropped on flush; B's first fetch reseeds silently).
        questsData = board(3)
        rerender(<GamificationEventHost />)
        expect(toastSuccess).not.toHaveBeenCalled()
    })

    it("does not open the level-up moment on the first progression fetch", () => {
        progressionData = progression(12)
        render(<GamificationEventHost />)
        expect(screen.queryByText(/moment\.levelUpBody/)).toBeNull()
    })

    it("opens the level-up moment when the level increases", () => {
        progressionData = progression(12)
        const { rerender } = render(<GamificationEventHost />)
        expect(screen.queryByText(/moment\.levelUpBody/)).toBeNull()

        progressionData = progression(13)
        rerender(<GamificationEventHost />)
        const body = screen.getByText(/moment\.levelUpBody/)
        expect(body.textContent).toContain("13")
    })
})
