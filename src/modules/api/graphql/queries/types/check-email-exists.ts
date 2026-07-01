import type { GraphQLResponse } from "../../types"

/** Request body for `checkEmailExists` (mirrors GraphQL `CheckEmailExistsRequest`). */
export interface CheckEmailExistsRequest {
    /** Email address to probe against the bloom filter. */
    email: string
}

/** Data returned when the bloom filter answers (see backend `CheckEmailExistsData`). */
export interface CheckEmailExistsData {
    /**
     * True when the filter may contain this email; false means it is definitely absent
     * (no false negatives; false positives are possible when true).
     */
    exists: boolean
    /** False until the server-side filter is warmed in cache. */
    isBloomFilterReady: boolean
}

/** Apollo response shape for the `checkEmailExists` query. */
export interface QueryCheckEmailExistsResponse {
    /** Top-level `checkEmailExists` field wrapping the standard API response. */
    checkEmailExists: GraphQLResponse<CheckEmailExistsData>
}
