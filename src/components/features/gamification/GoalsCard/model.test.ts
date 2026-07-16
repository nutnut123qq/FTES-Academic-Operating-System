import { describe, expect, it } from "vitest"
import type { GoalView } from "@/modules/api/rest/gamification"
import { goalKey, parseTarget, sortGoals } from "./model"

/**
 * Unit — GoalsCard pure model (task 4.2): stable goal ordering and target
 * parsing. These guard the card's display order and the "BE rejects target ≤ 0"
 * contract without rendering.
 */

const goal = (period: string, metric: string, target = 5): GoalView => ({
    id: `${period}-${metric}`,
    period,
    metric,
    target,
})

describe("goalKey", () => {
    it("identifies a goal by its (period, metric) pair", () => {
        expect(goalKey("WEEKLY", "XP")).toBe("WEEKLY:XP")
    })
})

describe("sortGoals", () => {
    it("orders by period (daily→weekly→monthly) then metric (xp→lessons→minutes)", () => {
        const ordered = sortGoals([
            goal("MONTHLY", "MINUTES"),
            goal("WEEKLY", "LESSONS"),
            goal("DAILY", "XP"),
            goal("WEEKLY", "XP"),
        ])
        expect(ordered.map((g) => `${g.period}:${g.metric}`)).toEqual([
            "DAILY:XP",
            "WEEKLY:XP",
            "WEEKLY:LESSONS",
            "MONTHLY:MINUTES",
        ])
    })

    it("sorts unknown period/metric values last without dropping them", () => {
        const ordered = sortGoals([goal("QUARTERLY", "STARS"), goal("DAILY", "XP")])
        expect(ordered.map((g) => g.period)).toEqual(["DAILY", "QUARTERLY"])
    })

    it("does not mutate the input array", () => {
        const input = [goal("WEEKLY", "XP"), goal("DAILY", "XP")]
        const snapshot = [...input]
        sortGoals(input)
        expect(input).toEqual(snapshot)
    })
})

describe("parseTarget", () => {
    it("accepts a positive integer", () => {
        expect(parseTarget("5")).toBe(5)
        expect(parseTarget("  12 ")).toBe(12)
    })

    it("rejects zero, negatives and non-numbers (BE requires target > 0)", () => {
        expect(parseTarget("0")).toBeNull()
        expect(parseTarget("-3")).toBeNull()
        expect(parseTarget("")).toBeNull()
        expect(parseTarget("abc")).toBeNull()
    })
})
