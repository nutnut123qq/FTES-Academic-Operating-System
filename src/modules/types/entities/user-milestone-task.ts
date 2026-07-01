import type { AbstractEntity } from "./abstract"
import type { MilestoneSeverity } from "../enums"

/**
 * Links a user's enrollment to a specific milestone task.
 */
export interface UserMilestoneTaskEntity extends AbstractEntity {
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Parent enrollment ID. */
    enrollmentId: string
    /** Parent milestone task ID. */
    milestoneTaskId: string
    /** Review attempts for this user milestone task. */
    attempts?: Array<UserMilestoneTaskAttemptEntity>
}

/**
 * A single review attempt for a user milestone task.
 */
export interface UserMilestoneTaskAttemptEntity extends AbstractEntity {
    /** The sequence number of this attempt. */
    attemptNumber: number
    /** Whether the attempt passed. */
    passed: boolean
    /** Score achieved in this attempt (null when not yet graded). */
    score: number | null
    /** Feedback summary for this attempt. */
    shortFeedback: string | null
    /** When the attempt was finished processing. */
    processedAt: Date | null
    /** Concrete AI model that graded this attempt (e.g. "qwen2.5-coder:7b"); null for legacy. */
    servedModel: string | null
    /** Provider that served the grading model; null for legacy. */
    servedProvider: string | null
    /** Parent user milestone task ID. */
    userMilestoneTaskId: string
    /** Detailed feedback items for this attempt. */
    feedbacks?: Array<UserMilestoneTaskAttemptFeedbackEntity>
}

/**
 * Structured feedback item for a user milestone task attempt.
 */
export interface UserMilestoneTaskAttemptFeedbackEntity extends AbstractEntity {
    /** Short summary message for this feedback item. */
    message: string
    /** Severity of the feedback item. */
    severity: MilestoneSeverity
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Source location hint, e.g. file:line. */
    location: string | null
    /** Suggested change (code snippet or instruction). */
    suggestion: string | null
    /** Parent attempt ID. */
    attemptId: string
}
