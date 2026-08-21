// Pure rank-tier display helper for the gamification leaderboard.
//
// The stateful mock engine (`engine.ts` / `rules.ts`) has been removed — every
// live number now comes from the REST `/me/*` endpoints via
// `useQueryMyGamificationSwr`. The ONE piece of pure economics the UI still
// derives on the client is the rank tier a total-XP value falls into (the
// backend leaderboard carries no tier). That derivation lives here so both the
// composed snapshot hook and the leaderboard surfaces share exactly one copy.

/** A rank tier keyed by total XP. Order is ascending by `minXp`. */
export interface RankTier {
    /** Stable key (also the i18n key `gamification.tiers.<key>`). */
    key: string
    /** Inclusive lower bound of total XP for this tier. */
    minXp: number
    /** Static art shown beside the viewer's current total-XP rank. */
    badgeSrc: string
}

/**
 * The 5 rank tiers by TOTAL XP (not weekly rank):
 * Đồng 0–24 999 · Bạc 25 000–74 999 · Vàng 75 000–124 999 ·
 * Bạch Kim 125 000–199 999 · Kim Cương ≥ 200 000.
 */
export const RANK_TIERS: ReadonlyArray<RankTier> = [
    { key: "bronze", minXp: 0, badgeSrc: "/gamification/badges/badge-bronze.png" },
    { key: "silver", minXp: 25_000, badgeSrc: "/gamification/badges/badge-silver.png" },
    { key: "gold", minXp: 75_000, badgeSrc: "/gamification/badges/badge-gold.png" },
    { key: "platinum", minXp: 125_000, badgeSrc: "/gamification/badges/badge-crystal.png" },
    { key: "diamond", minXp: 200_000, badgeSrc: "/gamification/badges/badge-diamond.png" },
]

/**
 * Rank tier for a total XP amount, with the next tier's threshold (if any).
 *
 * @param xp - Total accumulated XP.
 * @returns The current {@link RankTier} plus the next tier and its `minXp`.
 */
export const tierFromXp = (xp: number): { tier: RankTier; next?: RankTier } => {
    const clamped = Math.max(0, xp)
    let tier = RANK_TIERS[0]
    let next: RankTier | undefined
    for (let i = 0; i < RANK_TIERS.length; i += 1) {
        if (clamped >= RANK_TIERS[i].minXp) {
            tier = RANK_TIERS[i]
            next = RANK_TIERS[i + 1]
        }
    }
    return { tier, next }
}
