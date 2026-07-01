import type { GraphQLResponse } from "../../types"
import type { ChallengeEntity } from "@/modules/types/entities/challenge"

/** Apollo response shape for the `challenge` query. */
export interface QueryChallengeResponse {
    /** Top-level `challenge` field wrapping the standard API response. */
    challenge: GraphQLResponse<ChallengeEntity>
}

/** Request body for the `challenge` query (mirrors GraphQL `ChallengeRequest`). */
export interface ChallengeRequest {
    /** Primary identifier of the challenge to fetch. */
    id: string
}
