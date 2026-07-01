import type { AiMode, ModelProvider } from "../../queries/query-my-ai-settings"
import type { GraphQLResponse, QueryVariables } from "../../types"

/** Request for `syncSubmission` (`challenge-submissions/sync-submission`). */
export interface SyncSubmissionRequest {
    /** Challenge submission id. */
    id: string
    /** Submission URL (GitHub/Google Docs per submission type); omit to sync only the grading selection. */
    url?: string
    /** AI grading lane to persist on the submission row. */
    selectedMode?: AiMode
    /** Concrete model name to persist on the submission row. */
    selectedModel?: string
    /** Provider serving the persisted model. */
    selectedModelProvider?: ModelProvider
    /**
     * One-shot BYOK key when syncing BYOK lane (not persisted on the row).
     */
    byokApiKey?: string
}

/** Apollo variables bag for the `syncSubmission` mutation. */
export type MutateSyncChallengeSubmissionsVariables = QueryVariables<SyncSubmissionRequest>

/** Apollo response shape for `syncSubmission` (no data payload). */
export interface MutateSyncChallengeSubmissionsResponse {
    /** Top-level `syncSubmission` field wrapping the standard API response. */
    syncSubmission: GraphQLResponse
}
