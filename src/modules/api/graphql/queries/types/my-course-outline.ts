import type { GraphQLResponse } from "../../types"

/** Minimal identity of the course an outline belongs to. */
export interface MyCourseOutlineCourse {
    /** Primary-key id of the course. */
    id: string
    /** Human-readable course title (locale-resolved). */
    title: string
    /** Stable display id of the course (mount / CDN slug, used for routing). */
    displayId: string
}

/**
 * A challenge under a lesson with the viewer's progress overlaid: lifecycle
 * status, latest score, and the completed flag.
 */
export interface MyCourseOutlineChallenge {
    /** Primary-key id of the challenge. */
    id: string
    /** Title of the challenge (locale-resolved). */
    title: string
    /** Difficulty of the challenge (e.g. easy | medium | hard | insane). */
    difficulty: string
    /** Maximum achievable score for this challenge. */
    maxScore: number
    /** Lifecycle status for the viewer: notStarted | inProgress | failed | completed. */
    status: string
    /** Score from the viewer's latest graded attempt (0 if never attempted). */
    lastScore: number
    /** Whether the viewer has completed the challenge (every submission passed). */
    completed: boolean
}

/**
 * A lesson (content) under a module, with the viewer's read flag overlaid and
 * the lesson's challenges (each with their own progress).
 */
export interface MyCourseOutlineLesson {
    /** Primary-key id of the lesson (content). */
    id: string
    /** Stable display id of the lesson (mount / CDN slug). */
    displayId: string
    /** Title of the lesson (locale-resolved). */
    title: string
    /** Estimated reading time of the lesson in minutes. */
    minutesRead: number
    /** Difficulty of the lesson (beginner | intermediate | advanced), or null if unset. */
    difficulty: string | null
    /** Whether the lesson is behind the premium paywall. */
    isPremium: boolean
    /** Whether the viewer has read this lesson. */
    isRead: boolean
    /** Challenges belonging to this lesson, ordered by sort index. */
    challenges: Array<MyCourseOutlineChallenge>
}

/**
 * A module (chapter) of the course, with its ordered lessons. The module's own
 * premium flag is surfaced so the client can paywall the whole chapter.
 */
export interface MyCourseOutlineModule {
    /** Primary-key id of the module. */
    id: string
    /** Title of the module (locale-resolved). */
    title: string
    /** Display order of the module within the course. */
    orderIndex: number
    /** Whether the whole module is behind the premium paywall. */
    isPremium: boolean
    /** Lessons belonging to this module, ordered by sort index. */
    lessons: Array<MyCourseOutlineLesson>
}

/**
 * A capstone (personal-project) task under a milestone, with the viewer's
 * progress overlaid: the completed flag and the latest score.
 */
export interface MyCourseOutlineTask {
    /** Primary-key id of the milestone task. */
    id: string
    /** Title of the milestone task (locale-resolved). */
    title: string
    /** Type of the task (design | techIntegrate | business), or null if unset. */
    type: string | null
    /** Maximum achievable score for this task. */
    maxScore: number
    /** Whether the viewer has completed (passed) the task. */
    completed: boolean
    /** Score from the viewer's latest attempt (0 if never attempted). */
    lastScore: number
}

/** A capstone milestone (batch) of the course, with its ordered tasks. */
export interface MyCourseOutlineMilestone {
    /** Primary-key id of the milestone. */
    id: string
    /** Title of the milestone (locale-resolved). */
    title: string
    /** Display order of the milestone within the course. */
    orderIndex: number
    /** Tasks belonging to this milestone, ordered by sort index. */
    tasks: Array<MyCourseOutlineTask>
}

/**
 * Aggregate progress summary for the viewer across the whole course: read
 * lessons, completed challenges, completed tasks, and an equal-weight overall
 * completion percentage.
 */
export interface MyCourseOutlineProgress {
    /** Number of lessons the viewer has read. */
    lessonsRead: number
    /** Total number of lessons in the course. */
    lessonsTotal: number
    /** Number of challenges the viewer has completed. */
    challengesCompleted: number
    /** Total number of challenges in the course. */
    challengesTotal: number
    /** Number of capstone tasks the viewer has completed. */
    tasksCompleted: number
    /** Total number of capstone tasks in the course. */
    tasksTotal: number
    /** Overall completion percent (equal-weight average of the three ratios, 0-100). */
    completionPercent: number
}

/**
 * Pointer to the next thing the viewer should work on. `kind` discriminates the
 * target and `milestoneId` is only set when the target is a milestone task.
 */
export interface MyCourseOutlineCurrentTask {
    /** Kind of the target: lesson | challenge | milestoneTask. */
    kind: string
    /** Primary-key id of the target (lesson, challenge, or milestone task). */
    id: string
    /** Owning milestone id when the target is a milestone task, otherwise null. */
    milestoneId: string | null
}

/**
 * Full outline payload inside `myCourseOutline.data`: course identity, the
 * module/lesson/challenge tree, the milestone/task tree, the aggregate progress
 * summary, and a pointer to the viewer's current task.
 */
export interface MyCourseOutlinePayload {
    /** Identity of the course. */
    course: MyCourseOutlineCourse
    /** Module/lesson/challenge tree, ordered by sort index. */
    modules: Array<MyCourseOutlineModule>
    /** Milestone/task tree, ordered by sort index. */
    milestones: Array<MyCourseOutlineMilestone>
    /** Aggregate progress summary for the viewer. */
    progress: MyCourseOutlineProgress
    /** Pointer to the viewer's current task, or null if everything is done. */
    currentTask: MyCourseOutlineCurrentTask | null
    /**
     * Content-first resume pointer for the course-content home: the next unread
     * lesson, else the first uncompleted challenge, else null when all content is
     * done. Never a milestone task (the capstone resumes on its own surface) —
     * unlike {@link MyCourseOutlinePayload.currentTask} which prefers capstone tasks.
     */
    nextContentTask: MyCourseOutlineCurrentTask | null
}

/** Apollo variables for `myCourseOutline(request: MyCourseOutlineRequest!)`. */
export interface MyCourseOutlineRequest {
    /** Raw primary-key id of the enrolled course to build the outline for. */
    courseId: string
}

/** Apollo response shape for the `myCourseOutline` query. */
export interface QueryMyCourseOutlineResponse {
    /** Top-level `myCourseOutline` field wrapping the standard API response. */
    myCourseOutline: GraphQLResponse<MyCourseOutlinePayload>
}
