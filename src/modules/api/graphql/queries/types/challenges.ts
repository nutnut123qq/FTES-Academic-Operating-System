import type { GraphQLResponse, PaginationFilters, SortInput } from "../../types"
import type { ChallengeEntity } from "@/modules/types/entities/challenge"

/** Paginated payload inside `challenges.data`. */
export interface QueryChallengesPayload {
    /** Total number of challenges matching the filter. */
    count: number
    /** Array of challenge entity rows for the current page. */
    data: Array<ChallengeEntity>
}

/** Pagination and sort filters for the challenges list. */
export type ChallengesListFilters = PaginationFilters<string>

/** Apollo variables for `challenges(request: ChallengesRequest!)`. */
export interface ChallengesListRequest {
    /** Pagination and sort filters for the challenges list. */
    filters: ChallengesListFilters
    /** Scopes the list to challenges belonging to this content id. */
    contentId: string
}

/** Apollo response shape for the `challenges` query. */
export interface QueryChallengesResponse {
    /** Top-level `challenges` field wrapping the standard API response. */
    challenges: GraphQLResponse<QueryChallengesPayload>
}

/** Default sort order for the challenges list (orderIndex ascending). */
export type DefaultChallengesListSorts = Array<SortInput<string>>
