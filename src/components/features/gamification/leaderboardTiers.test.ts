import { describe, expect, it } from "vitest"
import { RANK_TIERS, tierFromXp } from "./leaderboardTiers"

describe("leaderboard tiers", () => {
    it("pins the rebased total-XP thresholds", () => {
        expect(RANK_TIERS).toEqual([
            { key: "bronze", minXp: 0, badgeSrc: "/gamification/badges/badge-bronze.png" },
            { key: "silver", minXp: 25_000, badgeSrc: "/gamification/badges/badge-silver.png" },
            { key: "gold", minXp: 75_000, badgeSrc: "/gamification/badges/badge-gold.png" },
            { key: "platinum", minXp: 125_000, badgeSrc: "/gamification/badges/badge-crystal.png" },
            { key: "diamond", minXp: 200_000, badgeSrc: "/gamification/badges/badge-diamond.png" },
        ])
    })

    it.each([
        [24_999, "bronze", "silver"],
        [25_000, "silver", "gold"],
        [75_000, "gold", "platinum"],
        [125_000, "platinum", "diamond"],
        [200_000, "diamond", undefined],
    ])("maps %i XP to %s", (xp, tier, next) => {
        const result = tierFromXp(xp as number)
        expect(result.tier.key).toBe(tier)
        expect(result.next?.key).toBe(next)
    })
})
