import type { GraphQLResponse } from "../../types"

/** Payload inside `contentStatus.data` after the standard API wrapper. */
export interface ContentStatusData {
    /** Whether the current user has marked this content as read. */
    isRead: boolean
    /** Whether the current user has favorited/saved this content. */
    isFavorite: boolean
}

/** Request body for the `contentStatus` query (mirrors GraphQL `ContentStatusRequest`). */
export interface ContentStatusRequest {
    /** Primary identifier of the content whose status should be fetched. */
    contentId: string
}

/** Apollo response shape for the `contentStatus` query. */
export interface QueryContentStatusResponse {
    /** Top-level `contentStatus` field wrapping the standard API response. */
    contentStatus: GraphQLResponse<ContentStatusData>
}
