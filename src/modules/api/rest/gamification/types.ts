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

/** A single quest row on the daily quest board. */
export interface QuestItemView {
    code: string
    title: string
    description: string | null
    rewardCoin: number
    targetCount: number
    dailyLimit: number
    eventCount: number
    completedCount: number
    coinEarnedToday: number
    sortOrder: number
}

/** The current user's quest board for the active Vietnam day. */
export interface QuestBoardView {
    dateVn: string
    totalCoinToday: number
    quests: Array<QuestItemView>
}

/** XP earned on a single Vietnam-day date, used by the streak heatmap. */
export interface ActivityDayView {
    date: string
    xp: number
}

/** A window of activity days (default 12 weeks). */
export interface ActivityDaysView {
    weeks: number
    days: Array<ActivityDayView>
}

/** XP/level progression snapshot for the current user. */
export interface ProgressionView {
    totalXp: number
    level: number
    levelTitle: string
    nextLevelXp: number | null
    reputation: number
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

/**
 * One badge of the SYSTEM-WIDE catalog (`GET /api/v1/gamification/badges`) —
 * every badge that exists, not just the earned ones, with the human name, HOW to
 * earn it (`description`) and the viewer's own progress/earned state.
 */
export interface BadgeCatalogItem {
    /** Stable backend code, e.g. `FIRST_LESSON`. Never render this raw. */
    code: string
    kind: "BADGE" | "TITLE" | "TROPHY"
    /** Display name, already human ("Bài học đầu tiên"). */
    name: string
    /** How the badge is earned ("Hoàn thành 100 bài học"). */
    description: string
    iconUrl: string | null
    /**
     * Counter the progress is measured on. `null` ⇒ the badge has no measurable
     * progress and NO progress bar must be drawn.
     */
    counterKey: string | null
    /** Counter value the badge unlocks at. */
    threshold: number
    /** Viewer's progress, already clamped by the backend to `[0, threshold]`. */
    progress: number
    earned: boolean
    /** ISO-8601 timestamp of the award; `null` when not earned (or unknown). */
    awardedAt: string | null
    sortOrder: number
}

/**
 * Whole badge catalog plus the viewer's tally. `items` arrives pre-sorted
 * (`sortOrder` then `code`) — call sites must not re-sort.
 */
export interface BadgeCatalogView {
    earnedCount: number
    totalCount: number
    items: Array<BadgeCatalogItem>
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

// ---------------------------------------------------------------- Season boards (bảng theo KỲ)
//
// ★ Mọi kiểu dưới đây SAO CHÉP ĐÚNG `SeasonBoardController` của backend
// (`vn.ftes.aos.gamification.web.SeasonBoardController`). Không thêm trường nào backend
// không trả: một trường "mong sẽ có" nằm trong contract sẽ được tầng vẽ tin là có thật,
// và biến thành `undefined` chảy vào phép tính ngay khi bản thật về.

/**
 * Bảng nào đang được xem. Backend CHỈ phục vụ hai bảng (`parseBoard`):
 *
 *  - `total`  — mọi dòng sổ cái EXP trong kỳ; đây là bảng đua giải có phần thưởng thật.
 *  - `social` — EXP cộng đồng + workplace, hai mảng nhưng rank CHUNG một bảng.
 *
 * KHÔNG có `course` ở đây: bảng khoá học là query GraphQL `courseLeaderboard` đã có từ
 * trước với công thức riêng, và backend TỪ CHỐI `board=course` có chủ đích
 * (`GAMIFICATION_NOT_FOUND`) — dựng bản thứ hai sẽ đẻ ra hai con số cùng tên gọi.
 */
export type SeasonBoardKey = "total" | "social"

/**
 * Cờ trạng thái của một lần đọc bảng (`SeasonBoardService.State`).
 *
 * ★ HAI CA NÀY KHÔNG ĐƯỢC GỘP — backend cấp cờ này chính là để tách chúng:
 *  - `OK` + `entries` rỗng: kỳ đang chạy, chưa ai kiếm được EXP. Bảng trống là câu trả
 *    lời ĐÚNG.
 *  - `NO_SEASON`: KHÔNG có kỳ nào đang chạy. Bảng trống ở đây không phải câu trả lời —
 *    nó là "chưa có gì để hỏi". Nói "chưa ai có điểm" lúc này là một khẳng định SAI.
 */
export type SeasonBoardState = "OK" | "NO_SEASON"

/**
 * Một dòng bảng.
 *
 * ⚠️ Backend trả `userId` THÔ — không tên, không avatar (xem `SeasonBoardService
 * .BoardEntry`: "caller tự gắn tên/avatar"). FE hiện chưa có đường nào đổi userId sang
 * hồ sơ hàng loạt, nên dòng của người khác chỉ hiện mã rút gọn. Xem ghi chú ở
 * `SeasonBoards/model.ts`.
 */
export interface SeasonBoardEntryView {
    userId: string
    /** EXP của lát cắt bảng này đếm, trong kỳ. */
    xp: number
    /** Hạng 1-based do backend tính trên TOÀN dân số, không phải trong cửa sổ trả về. */
    rank: number
}

/** Một trang bảng (`GET /api/v1/gamification/boards/{board}?season=&limit=`). */
export interface SeasonBoardView {
    state: SeasonBoardState
    /** Mã bảng backend đã phục vụ (`TOTAL` / `SOCIAL`) — chữ HOA, khác key FE gửi đi. */
    board: string
    /** Mã kỳ (`gamification.seasons.code`); `null` khi `state = NO_SEASON`. */
    seasonCode: string | null
    /** Kỳ học (V291) nối vào mùa; `null` khi mùa chưa gắn kỳ nào. */
    termId: string | null
    entries: Array<SeasonBoardEntryView>
    /** Hạng người xem trên toàn dân số; `null` = chưa có EXP nào trong kỳ (KHÁC hạng chót). */
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
