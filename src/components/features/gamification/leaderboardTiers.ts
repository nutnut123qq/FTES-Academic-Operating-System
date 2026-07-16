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
}

/**
 * The 5 rank tiers by TOTAL XP (not weekly rank — league is deferred):
 * Đồng 0–499 · Bạc 500–1 499 · Vàng 1 500–3 499 · Bạch Kim 3 500–6 999 · Kim Cương ≥ 7 000.
 */
export const RANK_TIERS: ReadonlyArray<RankTier> = [
    { key: "bronze", minXp: 0 },
    { key: "silver", minXp: 500 },
    { key: "gold", minXp: 1500 },
    { key: "platinum", minXp: 3500 },
    { key: "diamond", minXp: 7000 },
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
