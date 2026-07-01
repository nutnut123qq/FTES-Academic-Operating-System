import type { GraphQLResponse } from "../../types"

/** Variables for the `userCapstoneProgress` query. */
export interface QueryUserCapstoneProgressRequest {
    /** Id of the user whose capstone progress to fetch. */
    userId: string
}

/** One passed/attempted task within a capstone milestone. */
export interface QueryUserCapstoneTaskItem {
    /** Milestone-task title. */
    title: string
    /** Whether the task has been passed. */
    passed: boolean
    /** Score achieved (best attempt). */
    score: number
    /** When the task was passed (ISO), or null. */
    passedAt: string | null
}

/** Progress for a single capstone milestone (a roadmap node). */
export interface QueryUserCapstoneMilestoneProgress {
    /** Milestone title. */
    title: string
    /** Ordering position (roadmap order). */
    position: number
    /** Total tasks in the milestone. */
    totalTasks: number
    /** Tasks the user has passed in the milestone. */
    passedTasks: number
    /** The milestone's tasks. */
    tasks: Array<QueryUserCapstoneTaskItem>
}

/** A user's personal-project capstone progress for one course (the showcase). */
export interface QueryUserCapstoneCourseProgress {
    /** Opaque global id of the course — pass to resolveRoute on click. */
    courseGlobalId: string
    /** Course title. */
    courseTitle: string
    /** Total milestones in the course's personal project. */
    totalMilestones: number
    /** Milestones fully completed (all tasks passed). */
    completedMilestones: number
    /** Total tasks across all milestones. */
    totalTasks: number
    /** Tasks passed across all milestones. */
    completedTasks: number
    /** Per-milestone progress, in roadmap order. */
    milestones: Array<QueryUserCapstoneMilestoneProgress>
}

/** Apollo response shape for the `userCapstoneProgress` query. */
export interface QueryUserCapstoneProgressResponse {
    /** Top-level `userCapstoneProgress` field wrapping the standard API response. */
    userCapstoneProgress: GraphQLResponse<Array<QueryUserCapstoneCourseProgress>>
}
