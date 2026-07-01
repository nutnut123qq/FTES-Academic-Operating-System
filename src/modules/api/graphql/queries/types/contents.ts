import type { GraphQLResponse, PaginationFilters, SortInput } from "../../types"
import type { ContentEntity } from "@/modules/types/entities/content"

/** Paginated payload inside `contents.data`. */
export interface QueryContentsPayload {
    /** Total number of content rows matching the filter. */
    count: number
    /** Array of content entity rows for the current page. */
    data: Array<ContentEntity>
}

/** Pagination and sort filters for the contents list. */
export type ContentsListFilters = PaginationFilters<string>

/** Apollo variables for `contents(request: ContentsRequest!)`. */
export interface ContentsListRequest {
    /** Pagination and sort filters for the contents list. */
    filters: ContentsListFilters
    /** Scopes the list to contents belonging to this module id. */
    moduleId: string
}

/** Apollo response shape for the `contents` query. */
export interface QueryContentsResponse {
    /** Top-level `contents` field wrapping the standard API response. */
    contents: GraphQLResponse<QueryContentsPayload>
}

/** Default sort order type for the contents list. */
export type DefaultContentsListSorts = Array<SortInput<string>>
