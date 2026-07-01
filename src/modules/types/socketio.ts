import type {
    JobCategory,
    JobStatus,
} from "./enums"

/** One hit row in the global search modal (grouped list UI). */
export interface GlobalSearchItem {
    /** Stable row id for React keys and selection. */
    id: string
    /** Primary heading line. */
    title?: string
    /** Secondary lines (may contain `<em>` for highlight). */
    texts?: Array<string>
    /** Fallback label when title is missing. */
    displayId?: string
}

/** Entity kinds the global search API can return; must stay aligned with backend / GraphQL search. */
export type SearchableEntity =
    | "CourseEntity"
    | "ModuleEntity"
    | "ContentEntity"
    | "LessonVideoEntity"
    | "ChallengeEntity"
    | "MilestoneEntity"
    | "MilestoneTaskEntity"
    | "FlashcardDeckEntity"

/** Grouped global-search hits, bucketed by entity kind. */
export interface GlobalSearchGroups {
    /** Course hits. */
    courses?: Array<GlobalSearchItem>
    /** Module hits. */
    modules?: Array<GlobalSearchItem>
    /** Challenge hits. */
    challenges?: Array<GlobalSearchItem>
    /** Content hits. */
    contents?: Array<GlobalSearchItem>
    /** Lesson-video hits. */
    lessonVideos?: Array<GlobalSearchItem>
    /** Flashcard-deck hits. */
    flashcardDecks?: Array<GlobalSearchItem>
    /** Milestone hits. */
    milestones?: Array<GlobalSearchItem>
    /** Milestone-task hits. */
    milestoneTasks?: Array<GlobalSearchItem>
}

/** Payload shape for global search subscription results (mirrors UI `GlobalSearchContent`). */
export interface GlobalSearchSocketIoMessage {
    /** Grouped hits returned from the search service. */
    data?: GlobalSearchGroups
}

/** Inner payload of a job-status-updated server push. */
export interface JobStatusUpdatedData {
    /** The challenge submission this job belongs to, when applicable. */
    challengeSubmissionId?: string
    /** The background job id. */
    jobId?: string
    /** Present when the server knows the UI bucket for this job. */
    category?: JobCategory
    /** Current processing status of the job. */
    status?: JobStatus
    /** Error detail when `status` indicates failure. */
    error?: string
}

/** Server push when a challenge-submission job status changes. */
export interface JobStatusUpdatedSocketIoMessage {
    /** Status envelope (absent until the first push arrives). */
    data?: JobStatusUpdatedData
}
