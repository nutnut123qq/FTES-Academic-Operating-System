/**
 * Request/response DTOs for the gamification REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.gamification.web.dto.GamificationViews`
 * and the inline admin request records in `GamificationAdminController`.
 */

/** Generic paginated view used by the gamification domain. */
export interface GamificationPageView<T> {
    items: Array<T>
    page: number
    size: number
    hasNext: boolean
}

/** A single XP ledger entry. */
export interface XpEntryView {
    id: string
    ruleKey: string
    amount: number
    subjectId: string | null
    occurredAt: string
}

/** Streak state for the current user. */
export interface StreakView {
    currentStreak: number
    longestStreak: number
    lastActiveDate: string | null
    freezeAvailable: number
}

/** A configured user goal. */
export interface GoalView {
    id: string
    period: string
    metric: string
    target: number
}

/** Body sent to `PUT /api/v1/gamification/me/goals`. */
export interface GoalUpdate {
    period: string
    metric: string
    target: number
}

/** A badge awarded to the current user. */
export interface BadgeView {
    code: string
    kind: string
    name: string
    awardedAt: string
}

/** One entry on a gamification leaderboard. */
export interface GamificationLeaderboardEntry {
    userId: string
    xp: number
    rank: number
}

/** Leaderboard payload with the viewer's optional rank. */
export interface GamificationLeaderboardView {
    entries: Array<GamificationLeaderboardEntry>
    myRank: number | null
}

/** Per-subject mastery summary. */
export interface MasteryView {
    subjectId: string
    completionPct: number
    consistencyScore: number
    subjectXp: number
    masteryLevel: string
}

/** Body sent to `POST /api/v1/gamification/rewards/pools/{code}/claim`. */
export interface ClaimRequest {
    idempotencyKey?: string
}

/** Result of claiming a reward pool. */
export interface ClaimResultView {
    rewardType: string
    amount: number
    alreadyClaimed: boolean
}

/** Public gamification summary for a user profile. */
export interface SummaryView {
    totalXp: number
    level: number
    levelTitle: string
    reputation: number
    badgeCount: number
}

// ---------------------------------------------------------------- Admin config

/** Body sent to `POST /api/v1/gamification/admin/xp-rules`. */
export interface XpRuleRequest {
    ruleKey: string
    amount: number
    dailyCap?: number | null
    reputationAmount: number
    active: boolean
}

/** XP rule entity returned by the admin endpoints. */
export interface XpRuleResponse {
    ruleKey: string
    amount: number
    dailyCap?: number | null
    reputationAmount: number
    active: boolean
}

/** Body sent to `POST /api/v1/gamification/admin/seasons`. */
export interface SeasonRequest {
    code: string
    startsAt: string
    endsAt: string
}

/** Season entity returned by the admin endpoints. */
export interface SeasonResponse {
    id: string
    code: string
    startsAt: string
    endsAt: string
    status: string
}

/** Body sent to `POST /api/v1/gamification/admin/reward-pools`. */
export interface RewardPoolRequest {
    code: string
    type: string
    costType: string
    costAmount: number
    active: boolean
}

/** Reward pool entity returned by the admin endpoints. */
export interface RewardPoolResponse {
    id: string
    code: string
    type: string
    costType: string
    costAmount: number
    active: boolean
}

/** Body sent to `POST /api/v1/gamification/admin/reward-pools/{poolId}/items`. */
export interface RewardItemRequest {
    rewardType: string
    amount: number
    badgeId?: string | null
    probability: number
    stock?: number | null
}

/** Reward item entity returned by the admin endpoints. */
export interface RewardItemResponse {
    id: string
    poolId: string
    rewardType: string
    amount: number
    badgeId: string | null
    probability: number
    stock: number | null
}

/** Body sent to `POST /api/v1/gamification/admin/xp-adjust`. */
export interface XpAdjustRequest {
    userId: string
    amount: number
    reason: string
}
