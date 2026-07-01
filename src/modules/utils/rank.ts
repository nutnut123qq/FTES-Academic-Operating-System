/**
 * Achievement rank derived from the viewer's highest reached tier.
 *
 * Every badge has four tiers; the tier a user has reached maps to a seniority
 * rank shown purely by the colour of the ring drawn around the mascot art:
 * `beginner` (grey) → `junior` (bronze) → `middle` (silver) → `senior` (gold).
 * The mascot art itself is rank-agnostic (one image per animal); only the ring
 * colour changes, so we never need four images per badge.
 */

/** The four seniority ranks, lowest → highest. */
export type AchievementRank = "beginner" | "junior" | "middle" | "senior"

/** A badge's rank standing for the viewer + the ring colour that encodes it. */
export interface RankInfo {
    /** The reached rank, or `null` when the badge is not yet earned (locked). */
    rank: AchievementRank | null
    /** Hex ring colour for the rank, or empty when locked. */
    ring: string
    /** i18n key for the rank label (e.g. `ranks.senior`), or `null` when locked. */
    labelKey: string | null
}

/** 1-based tier → rank. Tier 1 is the entry bar, tier 4 the mastery bar. */
const RANK_BY_TIER: Record<number, AchievementRank> = {
    1: "beginner",
    2: "junior",
    3: "middle",
    4: "senior",
}

/** Ring colour per rank: xám → đồng → bạc → vàng. */
const RING_BY_RANK: Record<AchievementRank, string> = {
    beginner: "#8C95A1",
    junior: "#B06A2C",
    middle: "#AEB8C4",
    senior: "#F0B429",
}

/**
 * Resolve a rank into its {@link RankInfo} (ring colour + label key).
 *
 * @param rank - the rank, or `null` for the locked/unranked state.
 * @returns the rank, ring colour, and label key (all null/empty when `null`).
 */
export const rankInfo = (rank: AchievementRank | null): RankInfo => {
    if (!rank) {
        return {
            rank: null,
            ring: "",
            labelKey: null,
        }
    }
    return {
        rank,
        ring: RING_BY_RANK[rank],
        labelKey: `ranks.${rank}`,
    }
}

/**
 * Resolve a single badge's earned status + reached tier into its {@link RankInfo}.
 *
 * @param earned - whether the viewer has earned the badge at all.
 * @param tierReached - highest tier reached (1–4), or `null` for a single-tier
 *   badge; treated as `beginner` when earned without an explicit tier.
 * @returns the rank, ring colour, and label key (all null/empty when locked).
 */
export const getRank = (
    earned: boolean,
    tierReached: number | null,
): RankInfo => {
    if (!earned) {
        return rankInfo(null)
    }
    const mapped = tierReached != null ? RANK_BY_TIER[tierReached] : undefined
    return rankInfo(mapped ?? "beginner")
}

/**
 * Resolve a user's overall seniority rank from the tiers reached across their
 * earned badges — a breadth-gated "highest tier", so a single lucky badge can't
 * inflate the rank. Higher ranks require reaching that tier on *multiple* badges:
 *
 * - `senior` — ≥ 2 badges at tier 4
 * - `middle` — ≥ 2 badges at tier ≥ 3, or any 1 badge at tier 4
 * - `junior` — ≥ 2 badges at tier ≥ 2, or any 1 badge at tier ≥ 3
 * - `beginner` — at least 1 earned badge
 * - `null` — nothing earned yet
 *
 * @param earnedTiers - reached tier (1–4) of every *earned* badge.
 * @returns the overall rank, or `null` when no badge is earned.
 */
export const resolveSeniorityRank = (
    earnedTiers: ReadonlyArray<number>,
): AchievementRank | null => {
    if (earnedTiers.length === 0) {
        return null
    }
    const atLeast = (tier: number): number =>
        earnedTiers.filter((reached) => reached >= tier).length
    const t4 = atLeast(4)
    const t3 = atLeast(3)
    const t2 = atLeast(2)
    // cascade low → high so the highest satisfied gate wins
    let rank: AchievementRank = "beginner"
    if (t2 >= 2 || t3 >= 1) {
        rank = "junior"
    }
    if (t3 >= 2 || t4 >= 1) {
        rank = "middle"
    }
    if (t4 >= 2) {
        rank = "senior"
    }
    return rank
}

/** A single unmet bar toward the next rank: `count` badges at tier `tier`. */
interface RankGate {
    /** Tier bar a badge must reach to count toward this gate. */
    tier: number
    /** How many badges at that tier the gate requires. */
    count: number
}

/** The OR-ed gates that unlock each rank (any one satisfied → that rank). */
const GATES_FOR_RANK: Record<Exclude<AchievementRank, "beginner">, RankGate[]> = {
    junior: [{ tier: 2, count: 2 }, { tier: 3, count: 1 }],
    middle: [{ tier: 3, count: 2 }, { tier: 4, count: 1 }],
    senior: [{ tier: 4, count: 2 }],
}

/** Next rank up from the current one, or `null` when already at the top. */
const NEXT_RANK: Record<AchievementRank, Exclude<AchievementRank, "beginner"> | null> = {
    beginner: "junior",
    junior: "middle",
    middle: "senior",
    senior: null,
}

/** What a user needs to climb one rank — plain enough to render in a tooltip. */
export interface SeniorityExplain {
    /** Current overall rank, or `null` when nothing is earned yet. */
    rank: AchievementRank | null
    /** Total earned badges (the breadth the ladder is gated on). */
    earnedCount: number
    /** The rank above the current one, or `null` when already senior. */
    next: AchievementRank | null
    /**
     * The nearest unmet bar toward {@link next} — the gate closest to done, so the
     * tooltip can say "need N more badges at tier T (have H)". `null` when maxed.
     */
    need: { tier: number; count: number; have: number; remaining: number } | null
}

/**
 * Explain a user's seniority for a tooltip: their current rank, how many badges
 * they've earned, the next rank, and the SINGLE easiest remaining bar to reach it
 * (the gate with the fewest badges still missing). Mirrors
 * {@link resolveSeniorityRank} — same gates, read backwards into "what's left".
 *
 * @param earnedTiers - reached tier (1–4) of every *earned* badge.
 * @returns a {@link SeniorityExplain} for plain-language rendering.
 */
export const explainSeniority = (
    earnedTiers: ReadonlyArray<number>,
): SeniorityExplain => {
    const rank = resolveSeniorityRank(earnedTiers)
    const next = rank ? NEXT_RANK[rank] : "junior"
    const atLeast = (tier: number): number =>
        earnedTiers.filter((reached) => reached >= tier).length

    let need: SeniorityExplain["need"] = null
    if (next) {
        // pick the gate closest to completion (smallest positive remaining); if a
        // gate is already met `next` would have been reached, so remaining > 0 here
        for (const gate of GATES_FOR_RANK[next]) {
            const have = atLeast(gate.tier)
            const remaining = Math.max(0, gate.count - have)
            if (need === null || remaining < need.remaining) {
                need = { tier: gate.tier, count: gate.count, have, remaining }
            }
        }
    }

    return {
        rank,
        earnedCount: earnedTiers.length,
        next,
        need,
    }
}
