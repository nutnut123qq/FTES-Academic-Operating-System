import type { GraphQLResponse } from "../../types"

/** A clickable left-rail item (course / lesson / challenge) — token-based. */
export interface QueryMyDashboardRefItemData {
    /** Opaque global id — pass to resolveRoute on click. */
    globalId: string
    /** Token label (course / lesson / challenge title). */
    label: string
}

/** Per-course progress item for the left rail (content / challenge / milestone). */
export interface QueryMyDashboardMilestoneProgressItemData {
    /** Opaque global id of the course — pass to resolveRoute on click. */
    globalId: string
    /** Course title (the token label). */
    label: string
    /** Course Thumbnail URL (null when unset) — shown as the course tile. */
    thumbnailUrl: string | null
    /** Lessons the viewer has read in the course. */
    contentCompleted: number
    /** Total contents (lessons) in the course. */
    contentTotal: number
    /** Challenges the viewer has passed in the course. */
    challengeCompleted: number
    /** Total challenges in the course. */
    challengeTotal: number
    /** Number of milestone tasks the viewer has passed. */
    completed: number
    /** Total milestone tasks in the course. */
    total: number
    /** Overall completion %, equal-weight across content/challenge/milestone (0–100). */
    completionPercent: number
    /** True when the user has actually enrolled/paid; false for a trial (preview) placeholder. */
    isEnrolled: boolean
}

/** One day in the last-7-days streak strip. */
export interface QueryMyWeeklyStatsDayData {
    /** Calendar day, YYYY-MM-DD (oldest → today). */
    date: string
    /** Whether the user earned any XP that day. */
    active: boolean
}

/** Streak + rolling 7-day activity stats for the streak strip. */
export interface QueryMyDashboardWeeklyStatsData {
    /** Consecutive days (up to today) with at least one XP event. */
    streak: number
    /** Longest-ever consecutive-day streak. */
    longestStreak: number
    /** Total XP earned in the last 7 days. */
    xp: number
    /** Number of lessons read in the last 7 days. */
    lessons: number
    /** The viewer's chosen weekly lessons target, or null when none is set. */
    weeklyGoalLessons: number | null
    /** Streak freezes the viewer currently owns (cap 3). */
    streakFreezes: number
    /** The last 7 calendar days (oldest → today) with active flags. */
    days: Array<QueryMyWeeklyStatsDayData>
}

/**
 * The assembled dashboard rail payload — the client merges the four independent
 * leaf queries (myCourses / myLearnedLessons / myInProgressChallenges /
 * myWeeklyStats) back into one shape for the rail components.
 */
export interface QueryMyDashboardResponseData {
    /** Lessons the viewer recently read (left rail). */
    learnedLessons: Array<QueryMyDashboardRefItemData>
    /** Challenges the viewer has started but not yet passed (left rail). */
    inProgressChallenges: Array<QueryMyDashboardRefItemData>
    /** Every joined course with its milestone progress (doubles as the course list). */
    milestoneProgress: Array<QueryMyDashboardMilestoneProgressItemData>
    /** Rolling 7-day activity stats (streak / XP / lessons). */
    weeklyStats: QueryMyDashboardWeeklyStatsData
}

/** Apollo response shape for the `myCourses` query. */
export interface QueryMyCoursesResponse {
    /** Top-level `myCourses` field wrapping the standard API response. */
    myCourses: GraphQLResponse<Array<QueryMyDashboardMilestoneProgressItemData>>
}

/** Apollo response shape for the `myLearnedLessons` query. */
export interface QueryMyLearnedLessonsResponse {
    /** Top-level `myLearnedLessons` field wrapping the standard API response. */
    myLearnedLessons: GraphQLResponse<Array<QueryMyDashboardRefItemData>>
}

/** Apollo response shape for the `myInProgressChallenges` query. */
export interface QueryMyInProgressChallengesResponse {
    /** Top-level `myInProgressChallenges` field wrapping the standard API response. */
    myInProgressChallenges: GraphQLResponse<Array<QueryMyDashboardRefItemData>>
}

/** Apollo response shape for the `myWeeklyStats` query. */
export interface QueryMyWeeklyStatsResponse {
    /** Top-level `myWeeklyStats` field wrapping the standard API response. */
    myWeeklyStats: GraphQLResponse<QueryMyDashboardWeeklyStatsData>
}

/** One active day in the GitHub-style contribution calendar. */
export interface QueryMyContributionDayData {
    /** Calendar day as YYYY-MM-DD. */
    date: string
    /** Lessons/contents read that day. */
    contents: number
    /** Challenges passed that day. */
    challenges: number
    /** Milestone tasks passed that day. */
    milestones: number
    /** Total contributions that day (drives the cell intensity). */
    total: number
}

/** Variables for the `myContributionCalendar` query. */
export interface QueryMyContributionCalendarRequest {
    /** Calendar year to read; omit for the current year. */
    year?: number
}

/** Apollo response shape for the `myContributionCalendar` query. */
export interface QueryMyContributionCalendarResponse {
    /** Top-level `myContributionCalendar` field wrapping the standard API response. */
    myContributionCalendar: GraphQLResponse<Array<QueryMyContributionDayData>>
}
