import type { AbstractEntity } from "./abstract"
import type { ChallengeSubmissionEntity } from "./challenge-submission"
import type { SubmissionAttemptEntity } from "./submission-attempt"
import type { UserEntity } from "./user"
import type { AiMode, ModelProvider } from "@/modules/api/graphql/queries/query-my-ai-settings"

/**
 * Join row user ↔ challenge submission (`user_submissions`).
 * Mirrors `ref/user-challenge-submission.entity.ts`.
 */
export interface UserChallengeSubmissionEntity extends AbstractEntity {
    /** The user that made the submission. */
    user: UserEntity
    /** The user's id. */
    userId: string
    /** Parent submission row; may be omitted in shallow queries. */
    submission?: ChallengeSubmissionEntity
    /** The parent challenge submission id. */
    submissionId: string
    /** The URL submitted by the user. */
    submissionUrl: string
    /** AI grading lane last chosen for this submission; null until picked. */
    selectedMode?: AiMode | null
    /** Concrete model name last chosen for this submission; null = balancer default. */
    selectedModel?: string | null
    /** Provider serving the chosen model; null when no model chosen. */
    selectedModelProvider?: ModelProvider | null
    /** SCHEMA V2: programming language last chosen for this submission; null until picked. */
    selectedLang?: string | null
    /** Total number of attempts made by the user. */
    attempts: number
    /** Best score achieved across all attempts. */
    score: number
    /** Most recent attempt, when loaded. */
    lastAttempt?: SubmissionAttemptEntity
}
