import type { GraphQLResponse } from "../../types"

/** Source metric an achievement is measured against (mirrors backend `AchievementCriteriaType`). */
export enum AchievementCriteriaType {
    /** Lessons/contents read. */
    LessonsRead = "lessonsRead",
    /** Consecutive active-day streak. */
    StreakDays = "streakDays",
    /** Challenges passed. */
    ChallengesPassed = "challengesPassed",
    /** Milestone tasks passed. */
    MilestonesPassed = "milestonesPassed",
    /** Courses enrolled. */
    CoursesEnrolled = "coursesEnrolled",
}

/** One achievement with the viewer's earned status + live progress. */
export interface QueryMyAchievementItemData {
    /** Stable slug (also the badge art filename stem). */
    slug: string
    /** Localized display name. */
    name: string
    /** Localized description. */
    description: string
    /** MinIO object key of the badge art. */
    iconKey: string
    /** The source metric measured. */
    criteriaType: AchievementCriteriaType
    /** Metric value at which it is earned (first tier when tiered). */
    threshold: number
    /** Whether the viewer has earned it (any tier). */
    earned: boolean
    /** When first earned (ISO), or null. */
    earnedAt: string | null
    /** The viewer's current metric value. */
    currentValue: number
    /** Highest tier reached (1-based), or null. */
    tierReached: number | null
    /** Approx % of users who hold this badge (lower = rarer); null when not earned. */
    rarityPercent: number | null
}

/** The achievements payload: the full list, the earned count, + the newly earned. */
export interface QueryMyAchievementsData {
    /** Every achievement with the viewer's earned status + live progress. */
    data: Array<QueryMyAchievementItemData>
    /** How many of them the viewer has earned. */
    count: number
    /** Achievements whose first award was inserted on this read. */
    newAchievements: Array<QueryMyAchievementItemData>
}

/** Apollo response shape for the `myAchievements` query. */
export interface QueryMyAchievementsResponse {
    /** Top-level `myAchievements` field wrapping the standard API response. */
    myAchievements: GraphQLResponse<QueryMyAchievementsData>
}
