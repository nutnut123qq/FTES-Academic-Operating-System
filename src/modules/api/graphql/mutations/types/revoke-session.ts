import type { GraphQLResponse } from "../../types"

/** GraphQL `RevokeSessionRequest` body. */
export interface RevokeSessionRequest {
    /** The session id (from `mySessions`) of the device to log out. */
    sessionId: string
}

/** Apollo response shape for `revokeSession` (no data payload). */
export interface MutateRevokeSessionResponse {
    /** Top-level `revokeSession` field wrapping the standard API response. */
    revokeSession: GraphQLResponse
}
