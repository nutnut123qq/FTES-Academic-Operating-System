import type { AbstractEntity } from "./abstract"
import type { ChallengeEntity } from "./challenge"
import type { ChallengeSubmissionTranslationEntity } from "./challenge-submission-translation"
import type { SubmissionType } from "../enums/submission-type"
import type { UserChallengeSubmissionEntity } from "./user-challenge-submission"

/**
 * Submission requirement attached to a challenge (`challenge_submissions`).
 * GraphQL object name: `Submission` — mirrors `ref/challenge-submission.entity.ts`.
 *
 * Nested `challenge` / `translations` / `userSubmissions` may be omitted or partial depending on the query.
 */
export interface ChallengeSubmissionEntity extends AbstractEntity {
    /** The type of the challenge submission. */
    type: SubmissionType
    /** The title of the challenge submission. */
    title: string
    /** The description of the challenge submission. */
    description: string | null
    /** The challenge of the challenge submission. */
    challenge?: ChallengeEntity
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** The translations of the challenge submission. */
    translations?: Array<ChallengeSubmissionTranslationEntity>
    /** The user submissions of the challenge submission. */
    userSubmissions?: Array<UserChallengeSubmissionEntity>
    /** Hydrated for the current user only (not a DB column). */
    userSubmission?: UserChallengeSubmissionEntity | null
    /** The score of the challenge submission. */
    score: number
}
