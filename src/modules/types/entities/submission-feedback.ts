import type { SubmissionFeedbackSeverity } from "../enums"
import type { AbstractEntity } from "./abstract"
import type { SubmissionAttemptEntity } from "./submission-attempt"

/**
 * A single feedback item for a submission attempt.
 */
export interface SubmissionFeedbackEntity extends AbstractEntity {
    /** The message of the feedback. */
    message: string
    /** The detail of the feedback. */
    detail: string | null
    /** The severity of the feedback. */
    severity: SubmissionFeedbackSeverity
    /** The location of the feedback. */
    location: string | null
    /** The suggestion of the feedback. */
    suggestion: string | null
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** The attempt that the feedback belongs to. */
    attempt: SubmissionAttemptEntity
}
