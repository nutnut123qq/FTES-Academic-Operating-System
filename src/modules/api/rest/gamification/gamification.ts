import { restRequest } from "@/modules/api/rest/client"
import type {
    ActivityDaysView,
    AvatarFrameLadderView,
    BadgeCatalogView,
    BadgeView,
    ClaimRequest,
    ClaimResultView,
    GamificationLeaderboardView,
    GamificationPageView,
    GoalUpdate,
    GoalView,
    MasteryView,
    ProgressionView,
    QuestBoardView,
    RewardItemRequest,
    RewardItemResponse,
    RewardPoolRequest,
    RewardPoolResponse,
    SeasonBoardKey,
    SeasonBoardView,
    SeasonRequest,
    SeasonResponse,
    SeasonWindowView,
    StreakView,
    SummaryView,
    XpAdjustRequest,
    XpEntryView,
    XpRuleRequest,
    XpRuleResponse,
} from "./types"

// ---------------------------------------------------------------- GamificationController

/**
 * Returns a paginated history of XP ledger entries for the current user.
 *
 * `GET /api/v1/gamification/me/xp-history?page=&size=`
 */
export const getMyXpHistory = async (params?: {
    page?: number
    size?: number
}): Promise<GamificationPageView<XpEntryView>> => {
    return restRequest<GamificationPageView<XpEntryView>>({
        method: "GET",
        url: "/gamification/me/xp-history",
        params: {
            page: params?.page ?? 0,
            size: params?.size ?? 20,
        },
    })
}

/**
 * Returns the current user's streak state.
 *
 * `GET /api/v1/gamification/me/streak`
 */
export const getMyStreak = async (): Promise<StreakView> => {
    return restRequest<StreakView>({
        method: "GET",
        url: "/gamification/me/streak",
    })
}

/**
 * Returns the current user's daily quest board for the active Vietnam day
 * (total coin earned today plus each active quest's progress/limit state).
 *
 * `GET /api/v1/gamification/me/quests`
 */
export const getMyQuests = async (): Promise<QuestBoardView> => {
    return restRequest<QuestBoardView>({
        method: "GET",
        url: "/gamification/me/quests",
    })
}

/**
 * Returns the current user's per-day XP window for the streak heatmap. Days
 * without activity are omitted by the backend; callers fill the window.
 *
 * `GET /api/v1/gamification/me/activity-days?weeks=`
 */
export const getMyActivityDays = async (params?: {
    weeks?: number
}): Promise<ActivityDaysView> => {
    return restRequest<ActivityDaysView>({
        method: "GET",
        url: "/gamification/me/activity-days",
        params: {
            weeks: params?.weeks ?? 12,
        },
    })
}

/**
 * Returns the current user's XP/level progression snapshot.
 *
 * `GET /api/v1/gamification/me/progression`
 */
export const getMyProgression = async (): Promise<ProgressionView> => {
    return restRequest<ProgressionView>({
        method: "GET",
        url: "/gamification/me/progression",
    })
}

/**
 * Consumes one streak freeze for the current user.
 *
 * `POST /api/v1/gamification/me/streak/freeze`
 */
export const useStreakFreeze = async (): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: "/gamification/me/streak/freeze",
    })
}

/**
 * Returns the current user's configured goals.
 *
 * `GET /api/v1/gamification/me/goals`
 */
export const getMyGoals = async (): Promise<Array<GoalView>> => {
    return restRequest<Array<GoalView>>({
        method: "GET",
        url: "/gamification/me/goals",
    })
}

/**
 * Creates or updates a goal for the current user.
 *
 * `PUT /api/v1/gamification/me/goals`
 */
export const putGoal = async (request: GoalUpdate): Promise<GoalView> => {
    return restRequest<GoalView>({
        method: "PUT",
        url: "/gamification/me/goals",
        data: request,
    })
}

/**
 * Returns the badges awarded to the current user.
 *
 * `GET /api/v1/gamification/me/badges`
 */
export const getMyBadges = async (): Promise<Array<BadgeView>> => {
    return restRequest<Array<BadgeView>>({
        method: "GET",
        url: "/gamification/me/badges",
    })
}

/**
 * Returns the WHOLE badge catalog — every badge in the system with its display
 * name, how it is earned, and the viewer's earned/progress state.
 *
 * `GET /api/v1/gamification/badges`
 *
 * Distinct from {@link getMyBadges}, which returns only the awarded ones.
 */
export const getBadgeCatalog = async (): Promise<BadgeCatalogView> => {
    return restRequest<BadgeCatalogView>({
        method: "GET",
        url: "/gamification/badges",
    })
}

/**
 * Returns a public gamification summary for a user.
 *
 * `GET /api/v1/gamification/users/{userId}/summary`
 */
export const getUserGamificationSummary = async (
    userId: string,
): Promise<SummaryView> => {
    return restRequest<SummaryView>({
        method: "GET",
        url: `/gamification/users/${userId}/summary`,
    })
}

/**
 * Returns a scoped leaderboard (global, group, or subject).
 *
 * `GET /api/v1/gamification/leaderboard?scope=&season=&limit=`
 */
export const getGamificationLeaderboard = async (params?: {
    scope?: string
    season?: string | null
    limit?: number
}): Promise<GamificationLeaderboardView> => {
    return restRequest<GamificationLeaderboardView>({
        method: "GET",
        url: "/gamification/leaderboard",
        params: {
            scope: params?.scope ?? "global",
            season: params?.season ?? undefined,
            limit: params?.limit ?? 20,
        },
    })
}

/**
 * Kì học đang chạy — mùa của CẢ BA bảng xếp hạng.
 *
 * `GET /api/v1/gamification/seasons/current`
 *
 * Khác {@link listSeasons} (admin-only, liệt kê mọi mùa): cái này công khai cho
 * người học và chỉ trả về mùa đang mở, vì thứ hạng không có nghĩa nếu không nói
 * được nó thuộc kì nào.
 *
 * ⚠️ Endpoint do lane BE "bảng xếp hạng theo kì" cấp và CHƯA merge lúc viết FE này.
 * Máy chủ chưa có ⇒ ném {@link RestError} 404/501 — người gọi PHẢI hiển thị lỗi
 * đọc được, KHÔNG được nuốt thành "chưa có kì nào".
 */
export const getCurrentSeason = async (): Promise<SeasonWindowView> => {
    return restRequest<SeasonWindowView>({
        method: "GET",
        url: "/gamification/seasons/current",
    })
}

/**
 * Một trong ba bảng xếp hạng theo kì.
 *
 * `GET /api/v1/gamification/leaderboards/{board}?seasonId=&courseId=&limit=`
 *
 * @param board - `course` | `community` | `total` ({@link SeasonBoardKey}).
 * @param params - `courseId` CHỈ dùng với `board="course"` (bảng đó xếp hạng nội bộ
 *   một khoá); `seasonId` bỏ trống = kì đang chạy.
 *
 * ⚠️ Cùng cảnh báo "BE chưa có" như {@link getCurrentSeason}.
 */
export const getSeasonBoard = async (
    board: SeasonBoardKey,
    params?: { seasonId?: string | null; courseId?: string | null; limit?: number },
): Promise<SeasonBoardView> => {
    return restRequest<SeasonBoardView>({
        method: "GET",
        url: `/gamification/leaderboards/${board}`,
        params: {
            seasonId: params?.seasonId ?? undefined,
            courseId: params?.courseId ?? undefined,
            limit: params?.limit ?? 50,
        },
    })
}

/**
 * Thang khung avatar của người xem: khung đang đeo + mọi bậc và điều kiện mở.
 *
 * `GET /api/v1/gamification/me/avatar-frames`
 *
 * ⚠️ Cùng cảnh báo "BE chưa có" như {@link getCurrentSeason}.
 */
export const getMyAvatarFrameLadder = async (): Promise<AvatarFrameLadderView> => {
    return restRequest<AvatarFrameLadderView>({
        method: "GET",
        url: "/gamification/me/avatar-frames",
    })
}

/**
 * Claims a reward from a pool by code.
 *
 * `POST /api/v1/gamification/rewards/pools/{code}/claim`
 */
export const claimRewardPool = async (
    code: string,
    request?: ClaimRequest,
): Promise<ClaimResultView> => {
    return restRequest<ClaimResultView>({
        method: "POST",
        url: `/gamification/rewards/pools/${code}/claim`,
        data: request,
    })
}

/**
 * Returns mastery summaries for all subjects of the current user.
 *
 * `GET /api/v1/gamification/me/mastery`
 */
export const getMyMastery = async (): Promise<Array<MasteryView>> => {
    return restRequest<Array<MasteryView>>({
        method: "GET",
        url: "/gamification/me/mastery",
    })
}

/**
 * Returns mastery details for a specific subject.
 *
 * `GET /api/v1/gamification/me/mastery/{subjectId}`
 */
export const getMyMasteryForSubject = async (
    subjectId: string,
): Promise<MasteryView> => {
    return restRequest<MasteryView>({
        method: "GET",
        url: `/gamification/me/mastery/${subjectId}`,
    })
}

// ---------------------------------------------------------------- GamificationAdminController

/**
 * Lists all configured XP rules.
 *
 * `GET /api/v1/gamification/admin/xp-rules`
 */
export const listXpRules = async (): Promise<Array<XpRuleResponse>> => {
    return restRequest<Array<XpRuleResponse>>({
        method: "GET",
        url: "/gamification/admin/xp-rules",
    })
}

/**
 * Creates or updates an XP rule.
 *
 * `POST /api/v1/gamification/admin/xp-rules`
 */
export const upsertXpRule = async (
    request: XpRuleRequest,
): Promise<XpRuleResponse> => {
    return restRequest<XpRuleResponse>({
        method: "POST",
        url: "/gamification/admin/xp-rules",
        data: request,
    })
}

/**
 * Lists all seasons.
 *
 * `GET /api/v1/gamification/admin/seasons`
 */
export const listSeasons = async (): Promise<Array<SeasonResponse>> => {
    return restRequest<Array<SeasonResponse>>({
        method: "GET",
        url: "/gamification/admin/seasons",
    })
}

/**
 * Creates a new season.
 *
 * `POST /api/v1/gamification/admin/seasons`
 */
export const createSeason = async (
    request: SeasonRequest,
): Promise<SeasonResponse> => {
    return restRequest<SeasonResponse>({
        method: "POST",
        url: "/gamification/admin/seasons",
        data: request,
    })
}

/**
 * Requests manual closure of a season.
 *
 * `POST /api/v1/gamification/admin/seasons/{id}/close`
 */
export const closeSeason = async (id: string): Promise<SeasonResponse> => {
    return restRequest<SeasonResponse>({
        method: "POST",
        url: `/gamification/admin/seasons/${id}/close`,
    })
}

/**
 * Lists all reward pools.
 *
 * `GET /api/v1/gamification/admin/reward-pools`
 */
export const listRewardPools = async (): Promise<Array<RewardPoolResponse>> => {
    return restRequest<Array<RewardPoolResponse>>({
        method: "GET",
        url: "/gamification/admin/reward-pools",
    })
}

/**
 * Creates or updates a reward pool.
 *
 * `POST /api/v1/gamification/admin/reward-pools`
 */
export const upsertRewardPool = async (
    request: RewardPoolRequest,
): Promise<RewardPoolResponse> => {
    return restRequest<RewardPoolResponse>({
        method: "POST",
        url: "/gamification/admin/reward-pools",
        data: request,
    })
}

/**
 * Lists items in a reward pool.
 *
 * `GET /api/v1/gamification/admin/reward-pools/{poolId}/items`
 */
export const listRewardPoolItems = async (
    poolId: string,
): Promise<Array<RewardItemResponse>> => {
    return restRequest<Array<RewardItemResponse>>({
        method: "GET",
        url: `/gamification/admin/reward-pools/${poolId}/items`,
    })
}

/**
 * Adds an item to a reward pool.
 *
 * `POST /api/v1/gamification/admin/reward-pools/{poolId}/items`
 */
export const addRewardPoolItem = async (
    poolId: string,
    request: RewardItemRequest,
): Promise<RewardItemResponse> => {
    return restRequest<RewardItemResponse>({
        method: "POST",
        url: `/gamification/admin/reward-pools/${poolId}/items`,
        data: request,
    })
}

/**
 * Deletes a reward pool item.
 *
 * `DELETE /api/v1/gamification/admin/reward-pools/items/{itemId}`
 */
export const deleteRewardPoolItem = async (itemId: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/gamification/admin/reward-pools/items/${itemId}`,
    })
}

/**
 * Validates that a reward pool's item probabilities sum to 1.0.
 *
 * `GET /api/v1/gamification/admin/reward-pools/{poolId}/validate`
 */
export const validateRewardPool = async (poolId: string): Promise<boolean> => {
    return restRequest<boolean>({
        method: "GET",
        url: `/gamification/admin/reward-pools/${poolId}/validate`,
    })
}

/**
 * Performs an audited XP adjustment for a user.
 *
 * `POST /api/v1/gamification/admin/xp-adjust`
 */
export const adjustXp = async (
    request: XpAdjustRequest,
): Promise<number> => {
    return restRequest<number>({
        method: "POST",
        url: "/gamification/admin/xp-adjust",
        data: request,
    })
}
