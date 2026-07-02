// Single source of truth for FTES AOS gamification economics (§11).
//
// Every number that governs XP, levels, tiers, streak, freeze/repair and goals
// lives HERE and nowhere else. The leaderboard UI, the streak popover, the
// "Cách tính điểm" guide page, the +XP toast and the mock engine all import
// from this file — so the OpenSpec numbers are a contract encoded in exactly
// one place. Changing a value here changes it everywhere.
//
// ponytail: FE-only assumption. When a real backend lands, these constants
// become the BE contract and the pure functions below can validate it.

/** Actions that can award XP. Learning actions (★) are multiplied by streak. */
export enum GamificationActionType {
    /** ★ Completed one lesson. */
    LessonComplete = "lessonComplete",
    /** ★ Submitted a quiz (XP by score band — see {@link quizXpForScore}). */
    QuizSubmit = "quizSubmit",
    /** ★ Completed one challenge. */
    ChallengeComplete = "challengeComplete",
    /** First login of the day (no streak, no multiplier). */
    DailyLogin = "dailyLogin",
    /** A post of the user's was upvoted (daily cap). */
    PostUpvote = "postUpvote",
    /** A comment of the user's was upvoted (daily cap). */
    CommentUpvote = "commentUpvote",
    /** Completed the Daily goal (no multiplier). */
    DailyGoal = "dailyGoal",
    /** Completed the Weekly goal (no multiplier). */
    WeeklyGoal = "weeklyGoal",
}

/**
 * Base XP per action, before any streak multiplier. For {@link GamificationActionType.QuizSubmit}
 * the amount depends on score — use {@link quizXpForScore} instead of this table.
 */
export const XP_TABLE: Readonly<Record<GamificationActionType, number>> = {
    [GamificationActionType.LessonComplete]: 20,
    [GamificationActionType.QuizSubmit]: 0, // score-dependent — see quizXpForScore
    [GamificationActionType.ChallengeComplete]: 40,
    [GamificationActionType.DailyLogin]: 5,
    [GamificationActionType.PostUpvote]: 2,
    [GamificationActionType.CommentUpvote]: 1,
    [GamificationActionType.DailyGoal]: 10,
    [GamificationActionType.WeeklyGoal]: 50,
}

/** Quiz XP by score band: `< 60% → 10`, `60–84% → 20`, `85–99% → 35`, `100% → 50`. */
export const QUIZ_XP_TIERS: ReadonlyArray<{ minPercent: number; xp: number }> = [
    { minPercent: 100, xp: 50 },
    { minPercent: 85, xp: 35 },
    { minPercent: 60, xp: 20 },
    { minPercent: 0, xp: 10 },
]

/** Daily XP caps for community upvote actions (post: +20/day, comment: +10/day). */
export const UPVOTE_DAILY_CAP: Readonly<Record<GamificationActionType.PostUpvote | GamificationActionType.CommentUpvote, number>> = {
    [GamificationActionType.PostUpvote]: 20,
    [GamificationActionType.CommentUpvote]: 10,
}

/**
 * Level curve: total XP required to REACH level `L` is `35 × (L − 1)²`.
 * Equivalent inverse `level = 1 + floor(sqrt(xp / 35))`. Matches the mock
 * snapshot (4 820 XP → level 12; level 13 needs 5 040).
 */
export const LEVEL_CURVE = {
    /** Coefficient in `35 × (L − 1)²`. */
    factor: 35,
} as const

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

/** Streak XP multiplier: +5% per consecutive day, capped at +50% (from day 10). */
export const STREAK_MULTIPLIER_STEP = 0.05
/** Maximum bonus fraction the streak multiplier can reach (+50%). */
export const STREAK_MULTIPLIER_CAP = 0.5

/** A one-time streak milestone reward. */
export interface StreakMilestone {
    /** Streak length (in days) that unlocks the reward. */
    days: number
    /** i18n key for the badge name (`gamification.milestones.<badgeKey>.name`). */
    badgeKey: string
    /** FTES coin awarded. */
    coin: number
    /** Streak Freeze granted, if any. */
    freeze?: number
    /** Whether a Title is granted (100-day milestone). */
    grantsTitle?: boolean
}

/**
 * One-time streak milestones: 7d → "Tuần Lửa" + 50 coin; 30d → "Tháng Bền Bỉ"
 * + 200 coin + 1 Freeze; 100d → "Trăm Ngày Lửa" + 1 000 coin + title. Each is
 * awarded once per lifetime (repair does not re-grant).
 */
export const STREAK_MILESTONES: ReadonlyArray<StreakMilestone> = [
    { days: 7, badgeKey: "weekOfFire", coin: 50 },
    { days: 30, badgeKey: "monthOfGrit", coin: 200, freeze: 1 },
    { days: 100, badgeKey: "hundredDays", coin: 1000, grantsTitle: true },
]

/** Streak Freeze rules: hold at most 2; buy one for 50 coin; auto-consumed to save a missed day. */
export const FREEZE = {
    /** Maximum freezes held at once. */
    max: 2,
    /** FTES coin to buy one freeze. */
    cost: 50,
} as const

/** Streak Repair rules: within 48h of a reset, restore for `10 × lostDays` coin (cap 200). */
export const REPAIR = {
    /** Hours after a reset during which repair is offered. */
    windowHours: 48,
    /** Coin per lost streak day. */
    costPerDay: 10,
    /** Maximum repair cost. */
    costCap: 200,
} as const

/** The reminder is pushed at 20:00 local when streak ≥ 3 and no learning action yet today. */
export const REMINDER = {
    /** Local hour (24h) the streak-at-risk reminder fires. */
    hour: 20,
    /** Minimum streak for the reminder to fire. */
    minStreak: 3,
} as const

/** Daily/Weekly goal definitions. */
export const GOALS = {
    /** Daily goal: complete 2 learning actions → +10 XP once/day. */
    daily: { target: 2, xp: XP_TABLE[GamificationActionType.DailyGoal] },
    /** Weekly goal: 5 streak-qualifying days in a Mon–Sun week → +50 XP once/week. */
    weekly: { target: 5, xp: XP_TABLE[GamificationActionType.WeeklyGoal] },
} as const

/** Learning action types — the only ones that hold a streak and receive the multiplier. */
const QUALIFYING_ACTIONS: ReadonlyArray<GamificationActionType> = [
    GamificationActionType.LessonComplete,
    GamificationActionType.QuizSubmit,
    GamificationActionType.ChallengeComplete,
]

/**
 * Whether an action counts as a streak-qualifying learning action (holds the
 * streak and receives the multiplier). Login / upvote / goal do NOT qualify.
 *
 * @param type - The action type.
 * @returns True for lesson / quiz / challenge; false otherwise.
 */
export const isQualifyingAction = (type: GamificationActionType): boolean =>
    QUALIFYING_ACTIONS.includes(type)

/**
 * Level reached at a given total XP: `1 + floor(sqrt(xp / 35))`, minimum 1.
 *
 * @param xp - Total accumulated XP (non-negative).
 * @returns The level (≥ 1).
 */
export const levelFromXp = (xp: number): number =>
    1 + Math.floor(Math.sqrt(Math.max(0, xp) / LEVEL_CURVE.factor))

/**
 * Total XP required to REACH a given level: `35 × (L − 1)²`.
 *
 * @param level - Target level (≥ 1).
 * @returns Minimum total XP for that level.
 */
export const xpForLevel = (level: number): number =>
    LEVEL_CURVE.factor * Math.pow(Math.max(1, level) - 1, 2)

/**
 * XP still needed to reach the next level from the current total.
 *
 * @param xp - Total accumulated XP.
 * @returns Remaining XP to the next level (≥ 0).
 */
export const xpToNextLevel = (xp: number): number => {
    const nextLevel = levelFromXp(xp) + 1
    return Math.max(0, xpForLevel(nextLevel) - Math.max(0, xp))
}

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

/**
 * The streak XP multiplier as a fraction (e.g. `0.35` for +35%).
 * `min(days, 10) × 5%`, capped at +50%. Zero streak → 0.
 *
 * @param days - Current streak length in days.
 * @returns Bonus fraction in [0, 0.5].
 */
export const streakMultiplier = (days: number): number =>
    Math.min(STREAK_MULTIPLIER_CAP, Math.max(0, days) * STREAK_MULTIPLIER_STEP)

/**
 * Apply the streak multiplier to a base XP amount and round.
 * `round(base × (1 + multiplier))`.
 *
 * @param baseXp - Base XP before multiplier.
 * @param days - Current streak length (drives the multiplier).
 * @returns Multiplied, rounded XP.
 */
export const applyMultiplier = (baseXp: number, days: number): number =>
    Math.round(baseXp * (1 + streakMultiplier(days)))

/**
 * Quiz XP for a score percentage (0–100), before any streak multiplier.
 *
 * @param percent - Score as a percentage (0–100).
 * @returns Base quiz XP for the matching band.
 */
export const quizXpForScore = (percent: number): number => {
    const clamped = Math.max(0, Math.min(100, percent))
    for (const band of QUIZ_XP_TIERS) {
        if (clamped >= band.minPercent) return band.xp
    }
    return QUIZ_XP_TIERS[QUIZ_XP_TIERS.length - 1].xp
}

/**
 * The repair cost for a lost streak: `min(10 × lostDays, 200)`.
 *
 * @param lostDays - Length of the streak that was lost.
 * @returns Coin cost to repair.
 */
export const repairCost = (lostDays: number): number =>
    Math.min(REPAIR.costCap, REPAIR.costPerDay * Math.max(0, lostDays))

/**
 * The next streak milestone strictly beyond a given streak, with the days remaining.
 *
 * @param streak - Current streak length.
 * @returns The next {@link StreakMilestone} and remaining days, or undefined past the last.
 */
export const nextMilestone = (streak: number): { milestone: StreakMilestone; remaining: number } | undefined => {
    const milestone = STREAK_MILESTONES.find((m) => m.days > streak)
    if (!milestone) return undefined
    return { milestone, remaining: milestone.days - streak }
}
