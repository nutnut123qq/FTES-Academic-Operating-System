import type { GraphQLResponse } from "../../types"
import type { QueryMyFeedResponseData } from "./my-feed"

/** Variables for the cursor-paginated `userFeed` query (a user's activity timeline). */
export interface UserFeedRequest {
    /** Id of the user whose activity timeline to fetch. */
    userId: string
    /** Opaque cursor from the previous page; omit for page 1. */
    cursor?: string
    /** Max items per page. */
    limit?: number
}

/**
 * Apollo response shape for `userFeed`. Reuses {@link QueryMyFeedResponseData}
 * (items + nextCursor) — the page shape is identical to `myFeed`; the items are
 * the profile owner's own activity, newest first.
 */
export interface QueryUserFeedResponse {
    /** Top-level `userFeed` field wrapping the standard API response. */
    userFeed: GraphQLResponse<QueryMyFeedResponseData>
}
