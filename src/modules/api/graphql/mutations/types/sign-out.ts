import type { GraphQLResponse } from "../../types"

/** Apollo response shape for `signOut` (no data payload). */
export interface MutateSignOutResponse {
    /** Top-level `signOut` field wrapping the standard API response. */
    signOut: GraphQLResponse<void>
}
