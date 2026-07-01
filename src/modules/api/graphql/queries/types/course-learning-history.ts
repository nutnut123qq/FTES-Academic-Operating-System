import type { GraphQLResponse } from "../../types"

/**
 * Kind of per-course learning event surfaced in the day timeline. A 3-value
 * subset of the global activity types (lesson read / challenge passed / milestone
 * passed) — the only events that map cleanly back to a course.
 */
export enum CourseLearningEventType {
    /** Read a lesson for the first time. */
    LessonRead = "lessonRead",
    /** Passed a challenge. */
    ChallengePassed = "challengePassed",
    /** Passed a milestone task. */
    MilestonePassed = "milestonePassed",
}

/**
 * One learning event in a course's day timeline (`courseLearningHistory`): what
 * happened (`type`), the entity label, when it happened (`at`, the real
 * `activity.created_at`), plus optional module title + difficulty for context.
 */
export interface CourseLearningHistoryItemData {
    /** Stable id of the event (the underlying activity id). */
    id: string
    /** Kind of learning event (drives the row icon + microcopy). */
    type: CourseLearningEventType
    /** Human-readable label of the lesson / challenge / milestone task. */
    label: string
    /** When the event happened (real activity timestamp), ISO/Date string. */
    at: string
    /** Owning module title for context, or null when unavailable. */
    moduleTitle: string | null
    /** Difficulty (beginner | intermediate | advanced), or null when unset. */
    difficulty: string | null
}

/** One cursor-paginated page of a course's learning history. */
export interface CourseLearningHistoryResponseData {
    /** Events in this page, newest first. */
    items: Array<CourseLearningHistoryItemData>
    /** Opaque cursor for the next page, or null when the history is exhausted. */
    nextCursor: string | null
}

/** Variables for the cursor-paginated `courseLearningHistory` query. */
export interface CourseLearningHistoryRequest {
    /** Relay global id of the course (decoded server-side with `fromGlobalId`). */
    courseId: string
    /** Opaque cursor from the previous page; omit for page 1. */
    cursor?: string
    /** Max items per page (default 20, capped at 50 server-side). */
    limit?: number
}

/** Apollo response shape for the `courseLearningHistory` query. */
export interface QueryCourseLearningHistoryResponse {
    /** Top-level `courseLearningHistory` field wrapping the standard API response. */
    courseLearningHistory: GraphQLResponse<CourseLearningHistoryResponseData>
}
