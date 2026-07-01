import type { GraphQLResponse } from "../../types"
import type { ContentEntity } from "@/modules/types/entities/content"

/** Apollo response shape for the `content` query. */
export interface QueryContentResponse {
    /** Top-level `content` field wrapping the standard API response. */
    content: GraphQLResponse<ContentEntity>
}

/** Request body for the `content` query (mirrors GraphQL `ContentRequest`). */
export interface ContentRequest {
    /** The display id of the content to fetch. */
    displayId?: string
    /** The primary id of the content to fetch. */
    id?: string
}
