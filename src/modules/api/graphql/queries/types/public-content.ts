import type { GraphQLResponse } from "../../types"
import type { ContentEntity } from "@/modules/types/entities/content"

/** Apollo response shape for the `publicContent` query. */
export interface QueryPublicContentResponse {
    /** Top-level `publicContent` field wrapping the standard API response. */
    publicContent: GraphQLResponse<ContentEntity>
}

/** Request body for the `publicContent` query (mirrors GraphQL `PublicContentRequest`). */
export interface PublicContentRequest {
    /** The display id of the content to fetch. */
    displayId?: string
    /** The primary id of the content to fetch. */
    id?: string
}
