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

// ---------------------------------------------------------------- Season boards (kì học)

/**
 * Bảng nào đang được xem. BA bảng chỉ khác nhau ở chỗ ĐẾM LÁT CẮT EXP NÀO — cùng
 * một đơn vị EXP, không quy đổi, không hệ số:
 *
 *  - `course`    — chỉ EXP kiếm trong CHÍNH một khoá; xếp hạng NỘI BỘ khoá đó.
 *  - `community` — EXP cộng đồng + EXP workplace, hai nguồn riêng nhưng RANK CHUNG một bảng.
 *  - `total`     — gom cả ba nguồn; đây là bảng đua giải có phần thưởng thật.
 */
export type SeasonBoardKey = "course" | "community" | "total"

/**
 * Kì học đang chạy (`GET /api/v1/gamification/seasons/current`).
 *
 * MÙA = KÌ HỌC (V291 course term) — KHÔNG có lịch mùa thứ hai. `gamification.seasons`
 * (V65) được nối vào kì học, nên `termName` là tên người dùng đọc được còn `code` là
 * mã mùa kỹ thuật.
 */
export interface SeasonWindowView {
    seasonId: string
    /** Mã mùa (`gamification.seasons.code`). */
    code: string
    /** Tên kì học nối vào mùa; `null` khi mùa chưa gắn kì nào. */
    termName: string | null
    startsAt: string
    endsAt: string
    /** `SCHEDULED` | `RUNNING` | `CLOSED` (chuỗi mở — BE có thể thêm trạng thái). */
    status: string
}

/** Khung avatar một người đang ĐEO, kèm theo hàng xếp hạng (đủ để vẽ vòng viền). */
export interface SeasonBoardFrameView {
    code: string
    nameVi: string
    /** Giá trị CSS background do quản trị seed → an toàn vẽ thẳng (V341). */
    cssGradient: string
    /** Khung dạng PNG chồng lên avatar; `null` ⇒ vẽ bằng {@link cssGradient}. */
    assetUrl: string | null
}

/** Huy hiệu hiển thị cạnh tên trên bảng xếp hạng. */
export interface SeasonBoardBadgeView {
    code: string
    name: string
    iconUrl: string | null
}

/** Một dòng trên bảng xếp hạng theo kì. */
export interface SeasonBoardEntryView {
    userId: string
    /** Hạng 1-based do máy chủ tính trên TOÀN dân số, không phải chỉ trong cửa sổ trả về. */
    rank: number
    displayName: string | null
    username: string | null
    avatarUrl: string | null
    avatarFrame: SeasonBoardFrameView | null
    /** EXP của LÁT CẮT mà bảng này đếm, trong kì hiện tại. */
    xp: number
    /** Ba nguồn tách ra để giải thích "vì sao hạng này khác hạng kia". */
    courseXp: number
    communityXp: number
    workplaceXp: number
    badges: Array<SeasonBoardBadgeView>
}

/** Vị trí của chính người xem — có cả khi họ nằm ngoài cửa sổ top-N. */
export interface SeasonBoardMyRankView {
    rank: number
    xp: number
    courseXp: number
    communityXp: number
    workplaceXp: number
}

/**
 * Bảng xếp hạng theo kì
 * (`GET /api/v1/gamification/leaderboards/{board}?seasonId=&courseId=&limit=`).
 */
export interface SeasonBoardView {
    board: SeasonBoardKey
    /** Mùa (kì) mà bảng này thuộc về; `null` khi không có kì nào đang chạy. */
    seasonId: string | null
    computedAt: string | null
    entries: Array<SeasonBoardEntryView>
    myRank: SeasonBoardMyRankView | null
}

// ---------------------------------------------------------------- Avatar frames (khung)

/**
 * Một bậc khung avatar trong thang mở khoá
 * (`GET /api/v1/gamification/me/avatar-frames`).
 *
 * Hai LOẠI khung, khác nhau ở chỗ có mất hay không:
 *  - `LIFETIME`   — mở theo EXP TRỌN ĐỜI, giữ VĨNH VIỄN. Mất khung khi sang kì mới là
 *                   phạt người dùng vì thời gian trôi, nên không bao giờ thu lại.
 *  - `SEASON_TOP` — khung hạng 1/2/3 của một bảng trong một kì; CÓ HẠN, hết kì sau là mất.
 */
export interface AvatarFrameLadderItemView {
    code: string
    nameVi: string
    description: string | null
    cssGradient: string
    assetUrl: string | null
    kind: "LIFETIME" | "SEASON_TOP"
    /** Mốc EXP trọn đời để mở (chỉ `LIFETIME`); `null` với khung top mùa. */
    requiredXp: number | null
    /** Khung top mùa thuộc BẢNG nào (`null` với khung `LIFETIME`). */
    board: SeasonBoardKey | null
    /** Hạng phải giành (1/2/3) — chỉ `SEASON_TOP`. */
    topRank: number | null
    unlocked: boolean
    /** Hạn dùng của khung top mùa; `null` = vĩnh viễn. */
    expiresAt: string | null
}

/** Thang khung avatar của người xem + khung đang đeo. */
export interface AvatarFrameLadderView {
    /** EXP TRỌN ĐỜI (không reset theo kì) — thứ quyết định mở khung `LIFETIME`. */
    lifetimeXp: number
    /** Mã khung đang đeo; `null` = chưa đeo khung nào. */
    currentCode: string | null
    items: Array<AvatarFrameLadderItemView>
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
