import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { GoalView, QuestBoardView } from "@/modules/api/rest/gamification"

/**
 * Unit — the analytics overview hooks rewired to live gamification data (task 4.3):
 *  - `useQueryDailyQuestSwr` maps the live quest board (`useGetMyQuestsSwr`) into
 *    ordered rows + today's coin total (SAME cache as `/quests`, so they agree),
 *  - `useQueryWeeklyGoalsSwr` surfaces only WEEKLY goals from `useGetMyGoalsSwr`
 *    and shows the target only (no fabricated progress).
 *
 * The underlying REST hooks are mocked; `QuestBoard/model.questProgress` is the
 * real pure helper so the derived progress numbers are covered end to end.
 */

let questsData: QuestBoardView | undefined
vi.mock("@/hooks/swr/api/rest/queries/useGetMyQuestsSwr", () => ({
    useGetMyQuestsSwr: () => ({ data: questsData, isLoading: false, error: undefined, mutate: vi.fn() }),
}))

let goalsData: Array<GoalView> | undefined
vi.mock("@/hooks/swr/api/rest/queries/useGetMyGoalsSwr", () => ({
    useGetMyGoalsSwr: () => ({ data: goalsData, isLoading: false, error: undefined, mutate: vi.fn() }),
}))

import { useQueryDailyQuestSwr } from "./useQueryDailyQuestSwr"
import { useQueryWeeklyGoalsSwr } from "./useQueryWeeklyGoalsSwr"

beforeEach(() => {
    questsData = undefined
    goalsData = undefined
})

const quest = (over: Partial<QuestBoardView["quests"][number]>): QuestBoardView["quests"][number] => ({
    code: "Q",
    title: "Quest",
    description: null,
    rewardCoin: 50,
    targetCount: 1,
    dailyLimit: 1,
    eventCount: 0,
    completedCount: 0,
    coinEarnedToday: 0,
    sortOrder: 0,
    ...over,
})

describe("useQueryDailyQuestSwr", () => {
    it("returns no summary until the quest board has loaded", () => {
        questsData = undefined
        const { result } = renderHook(() => useQueryDailyQuestSwr())
        expect(result.current.data).toBeUndefined()
    })

    it("orders rows by sortOrder and derives progress + done state", () => {
        questsData = {
            dateVn: "2026-07-16",
            totalCoinToday: 120,
            quests: [
                quest({ code: "B", title: "Second", sortOrder: 2, targetCount: 2, dailyLimit: 1, eventCount: 1 }),
                quest({ code: "A", title: "First", sortOrder: 1, dailyLimit: 1, completedCount: 1, eventCount: 1 }),
            ],
        }
        const { result } = renderHook(() => useQueryDailyQuestSwr())
        const data = result.current.data
        expect(data?.rows.map((r) => r.code)).toEqual(["A", "B"])
        // A is fully claimed → done; B is 1/2 → not done
        expect(data?.rows[0]).toMatchObject({ code: "A", current: 1, total: 1, isDone: true })
        expect(data?.rows[1]).toMatchObject({ code: "B", current: 1, total: 2, isDone: false })
        expect(data?.totalCoinToday).toBe(120)
        expect(data?.doneCount).toBe(1)
        expect(data?.totalCount).toBe(2)
    })

    it("clamps an over-counted event into the day ceiling", () => {
        questsData = {
            dateVn: "2026-07-16",
            totalCoinToday: 0,
            quests: [quest({ code: "C", targetCount: 1, dailyLimit: 1, eventCount: 9 })],
        }
        const { result } = renderHook(() => useQueryDailyQuestSwr())
        expect(result.current.data?.rows[0]).toMatchObject({ current: 1, total: 1 })
    })
})

describe("useQueryWeeklyGoalsSwr", () => {
    it("keeps only WEEKLY goals and exposes their targets", () => {
        goalsData = [
            { id: "1", period: "DAILY", metric: "XP", target: 100 },
            { id: "2", period: "WEEKLY", metric: "LESSONS", target: 5 },
            { id: "3", period: "WEEKLY", metric: "MINUTES", target: 120 },
            { id: "4", period: "MONTHLY", metric: "XP", target: 4000 },
        ]
        const { result } = renderHook(() => useQueryWeeklyGoalsSwr())
        expect(result.current.goals).toEqual([
            { metric: "LESSONS", target: 5 },
            { metric: "MINUTES", target: 120 },
        ])
    })

    it("returns an empty list when no goals are set", () => {
        goalsData = undefined
        const { result } = renderHook(() => useQueryWeeklyGoalsSwr())
        expect(result.current.goals).toEqual([])
    })
})
