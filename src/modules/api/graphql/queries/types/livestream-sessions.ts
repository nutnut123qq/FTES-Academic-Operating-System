import type { GraphQLResponse, PaginationFilters, SortInput } from "../../types"
import type { LivestreamSessionEntity } from "@/modules/types/entities/livestream-session"

/** Paginated payload inside `livestreamSessions.data`. */
export interface QueryLivestreamSessionsPayload {
    /** Total number of session rows matching the filter. */
    count: number
    /** Array of livestream session entity rows for the current page. */
    data: Array<LivestreamSessionEntity>
}

/** Pagination and sort filters for the livestream sessions list. */
export type LivestreamSessionsListFilters = PaginationFilters<string>

/** Apollo variables for `livestreamSessions(request: LivestreamSessionsRequest!)`. */
export interface LivestreamSessionsListRequest {
    /** Scopes the list to sessions belonging to this course id. */
    courseId: string
    /** Pagination and sort filters for the sessions list. */
    filters: LivestreamSessionsListFilters
}

/** Apollo response shape for the `livestreamSessions` query. */
export interface QueryLivestreamSessionsResponse {
    /** Top-level `livestreamSessions` field wrapping the standard API response. */
    livestreamSessions: GraphQLResponse<QueryLivestreamSessionsPayload>
}

/** Default sort order type for the livestream sessions list. */
export type DefaultLivestreamSessionsListSorts = Array<SortInput<string>>
