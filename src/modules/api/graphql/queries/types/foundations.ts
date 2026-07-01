import type { PaginationFilters, SortInput } from "../../types"
import type { FoundationEntity } from "@/modules/types/entities/foundation"

/** Paginated payload inside `foundations.data`. */
export interface QueryFoundationsPayload {
    /** Total number of foundation rows matching the filter. */
    count: number
    /** Array of foundation entity rows for the current page. */
    data: Array<FoundationEntity>
}

/** Pagination and sort filters for the foundations list. */
export type FoundationsListFilters = PaginationFilters<string>

/** Apollo variables for `foundations(request: FoundationsRequest!)`. */
export interface FoundationsListRequest {
    /** The category id to scope the foundations list to. */
    categoryId: string
    /** Optional pagination and sort filters; omit for server defaults. */
    filters?: FoundationsListFilters
}

/** Apollo response shape for the `foundations` query (data is not wrapped in GraphQLResponse). */
export interface QueryFoundationsResponse {
    /** Top-level `foundations` field whose `data` field directly holds the paginated payload. */
    foundations: {
        /** Paginated payload containing count and data rows. */
        data: QueryFoundationsPayload
    }
}

/** Default sort order type for the foundations list. */
export type DefaultFoundationsListSorts = Array<SortInput<string>>
