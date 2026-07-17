import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — the three live gamification client fns added by change
 * `quest-board-streak-live` (task 1.2): `getMyQuests`, `getMyActivityDays`,
 * `getMyProgression`. `restRequest` is mocked so the tests pin the HTTP
 * contract (method, url, params) each fn sends and confirm each returns the
 * unwrapped envelope `data` verbatim — without touching axios or the network.
 */

const restRequest = vi.fn()

vi.mock("@/modules/api/rest/client", () => ({
    restRequest: (...args: Array<unknown>) => restRequest(...args),
}))

import { getMyActivityDays, getMyProgression, getMyQuests } from "./gamification"
import type {
    ActivityDaysView,
    ProgressionView,
    QuestBoardView,
} from "./types"

beforeEach(() => {
    restRequest.mockReset()
})

describe("getMyQuests", () => {
    it("GETs /gamification/me/quests and returns the unwrapped board", async () => {
        const board: QuestBoardView = {
            dateVn: "2026-07-16",
            totalCoinToday: 50,
            quests: [],
        }
        restRequest.mockResolvedValue(board)

        const result = await getMyQuests()

        expect(restRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/gamification/me/quests",
        })
        expect(result).toBe(board)
    })
})

describe("getMyActivityDays", () => {
    it("defaults to a 12-week window when no weeks arg is given", async () => {
        const days: ActivityDaysView = { weeks: 12, days: [] }
        restRequest.mockResolvedValue(days)

        const result = await getMyActivityDays()

        expect(restRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/gamification/me/activity-days",
            params: { weeks: 12 },
        })
        expect(result).toBe(days)
    })

    it("forwards an explicit weeks window", async () => {
        restRequest.mockResolvedValue({ weeks: 4, days: [] })

        await getMyActivityDays({ weeks: 4 })

        expect(restRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/gamification/me/activity-days",
            params: { weeks: 4 },
        })
    })
})

describe("getMyProgression", () => {
    it("GETs /gamification/me/progression and returns the unwrapped snapshot", async () => {
        const progression: ProgressionView = {
            totalXp: 1200,
            level: 5,
            levelTitle: "Apprentice",
            nextLevelXp: 1500,
            reputation: 40,
        }
        restRequest.mockResolvedValue(progression)

        const result = await getMyProgression()

        expect(restRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/gamification/me/progression",
        })
        expect(result).toBe(progression)
    })
})
