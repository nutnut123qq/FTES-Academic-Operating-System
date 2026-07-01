import type { GraphQLResponse } from "../../types"
import type { ReactionType } from "./discussion"

/**
 * Kind of in-app activity in the home feed (mirrors backend `ActivityType`).
 */
export enum ActivityType {
    /** Read a lesson for the first time. */
    LessonRead = "lessonRead",
    /** Bookmarked a lesson. */
    LessonBookmarked = "lessonBookmarked",
    /** Passed a challenge. */
    ChallengePassed = "challengePassed",
    /** Solved a coding problem. */
    CodingSolved = "codingSolved",
    /** Passed a milestone task. */
    MilestonePassed = "milestonePassed",
    /** Passed an AI Lab eval challenge. */
    AiLabPassed = "aiLabPassed",
    /** Enrolled in a course. */
    CourseEnrolled = "courseEnrolled",
    /** Posted a discussion comment. */
    DiscussionCommented = "discussionCommented",
    /** Started following another user. */
    UserFollowed = "userFollowed",
}

/** One activity item in the home feed (token-based). */
export interface QueryMyFeedItemData {
    /** Activity id — pass to reactToActivity (the thing being reacted to). */
    id: string
    /** Opaque global id of the actor (a user) — pass to resolveRoute on click. */
    actorGlobalId: string
    /** Actor username (the actor token label). */
    actorUsername: string
    /** Avatar URL of the actor, or null when unset. */
    actorAvatar: string | null
    /** Kind of activity (drives the feed phrasing). */
    type: ActivityType
    /** Opaque global id of the target entity — pass to resolveRoute on click. */
    targetGlobalId: string | null
    /** Target token label (lesson/challenge/course title, or username). */
    targetLabel: string | null
    /** When the activity happened (ISO string). */
    at: string
    /** Total reactions on this activity. */
    reactionCount: number
    /** The viewer's own reaction on this activity, or null. */
    myReaction: ReactionType | null
    /** Whether this activity belongs to the viewer (cannot react to own). */
    isMine: boolean
}

/** Which home feed to read (mirrors backend `MyFeedTab`). */
export enum MyFeedTab {
    /** Recommended — recent platform-wide activity. */
    ForYou = "forYou",
    /** Activity from followed users. */
    Following = "following",
}

/** Feed filter chip (mirrors backend `MyFeedCategory`). */
export enum MyFeedCategory {
    /** Everything (no type filter). */
    All = "all",
    /** Course/learning activity. */
    Courses = "courses",
    /** Achievement (pass) activity. */
    Achievements = "achievements",
    /** Social (follow/comment) activity. */
    People = "people",
}

/** Variables for the cursor-paginated `myFeed` query. */
export interface MyFeedRequest {
    /** Which feed to read. */
    tab: MyFeedTab
    /** Opaque cursor from the previous page; omit for page 1. */
    cursor?: string
    /** Max items per page. */
    limit?: number
    /** Filter chip — which slice of activity to show (defaults to All). */
    category?: MyFeedCategory
}

/** Payload inside `myFeed.data`. */
export interface QueryMyFeedResponseData {
    /** Feed items for this page, newest first. */
    items: Array<QueryMyFeedItemData>
    /** Cursor for the next page; null when no more. */
    nextCursor: string | null
}

/** Apollo response shape for `myFeed`. */
export interface QueryMyFeedResponse {
    /** Top-level `myFeed` field wrapping the standard API response. */
    myFeed: GraphQLResponse<QueryMyFeedResponseData>
}
