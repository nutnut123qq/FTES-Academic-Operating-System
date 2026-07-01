import type { GraphQLResponse, SortInput } from "../../types"
import type { ChallengeSubmissionEntity } from "@/modules/types/entities/challenge-submission"

/** Inner payload: list of submission rows for one challenge. */
export interface ChallengeSubmissionsPayload {
    /** Array of challenge submission entity rows. */
    data: Array<ChallengeSubmissionEntity>
}

/** Apollo variables for `challengeSubmissions(request: ChallengeSubmissionsRequest!)`. */
export interface ChallengeSubmissionsListRequest {
    /** The challenge whose submissions should be listed. */
    challengeId: string
    /** Filters containing sort clauses for the list. */
    filters: {
        /** Sort clauses to apply to the submissions list. */
        sorts: Array<SortInput<string>>
    }
}

/** Apollo response shape for the `challengeSubmissions` query. */
export interface QueryChallengeSubmissionsResponse {
    /** Top-level `challengeSubmissions` field wrapping the standard API response. */
    challengeSubmissions: GraphQLResponse<ChallengeSubmissionsPayload>
}
