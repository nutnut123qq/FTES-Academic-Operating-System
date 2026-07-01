import type { GraphQLResponse } from "../../types"
import type { ContentEntity } from "@/modules/types/entities/content"

/** Payload inside `savedContents.data` after the standard API wrapper. */
export interface SavedContentsData {
    /** Array of content entity rows the user has saved/favorited. */
    contents: Array<ContentEntity>
    /** Total number of saved content rows. */
    count: number
}

/** Apollo response shape for the `savedContents` query. */
export interface QuerySavedContentsResponse {
    /** Top-level `savedContents` field wrapping the standard API response. */
    savedContents: GraphQLResponse<SavedContentsData>
}

/** Request body for the `savedContents` query (mirrors GraphQL `SavedContentsRequest`). */
export interface SavedContentsRequest {
    /** Number of items to skip for manual offset pagination. */
    skip?: number
    /** Maximum number of items to return. */
    take?: number
    /** Case-insensitive search over the saved content title. */
    search?: string
}
