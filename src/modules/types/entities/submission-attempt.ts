import type { AbstractEntity } from "./abstract"
import type { SubmissionFeedbackEntity } from "./submission-feedback"
import type { UserChallengeSubmissionEntity } from "./user-challenge-submission"

/**
 * A single attempt of a user challenge submission.
 */
export interface SubmissionAttemptEntity extends AbstractEntity {
    /** The attempt number. */
    attemptNumber: number
    /** The score of the attempt. */
    score: number | null
    /** The short feedback of the attempt. */
    shortFeedback: string | null
    /** The date and time the attempt was processed. */
    processedAt: Date | null
    /** The URL of the source submitted in this attempt. */
    submissionUrl: string
    /** Concrete AI model that actually graded this attempt (e.g. `qwen2.5-coder:7b`); null for older attempts. */
    servedModel: string | null
    /** Provider that served the grading model (e.g. `local`, `openai`, `gemini`); null for older attempts. */
    servedProvider: string | null
    /** The parent user challenge submission. */
    userChallengeSubmission: UserChallengeSubmissionEntity
    /** The feedback items for this attempt. */
    feedbacks: Array<SubmissionFeedbackEntity>
}
