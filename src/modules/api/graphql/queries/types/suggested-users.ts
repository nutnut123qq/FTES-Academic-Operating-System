import type { GraphQLResponse } from "../../types"

/** One user suggested to the viewer for following. */
export interface QuerySuggestedUserData {
    /** Opaque global id of the suggested user (passed to `setFollow`). */
    globalId: string
    /** Unique handle, used both for the @mention and the profile route. */
    username: string
    /** Display name, or null when the user has not set one. */
    displayName: string | null
    /** Uploaded avatar URL, or null (a generated default is shown instead). */
    avatar: string | null
    /** Whether the user has flagged themselves as open to job offers. */
    openToWork: boolean
}

/** Apollo response shape for the `suggestedUsers` query. */
export interface QuerySuggestedUsersResponse {
    /** Top-level `suggestedUsers` field wrapping the standard API response. */
    suggestedUsers: GraphQLResponse<Array<QuerySuggestedUserData>>
}
