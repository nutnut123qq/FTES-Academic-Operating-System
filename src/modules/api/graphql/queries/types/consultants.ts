import type { GraphQLResponse, PaginationFilters, SortInput } from "../../types"
import type { ConsultantEntity } from "@/modules/types/entities/consultant"

/** Paginated payload inside `consultants.data`. */
export interface QueryConsultantsPayload {
    /** Total number of consultant rows matching the filter. */
    count: number
    /** Array of consultant entity rows for the current page. */
    data: Array<ConsultantEntity>
}

/** Pagination and sort filters for the consultants list. */
export type ConsultantsListFilters = PaginationFilters<string>

/** Apollo variables for `consultants(request: ConsultantsRequest!)`. */
export interface ConsultantsListRequest {
    /** The headhunting company id to scope the consultants list to. */
    companyId: string
    /** Optional pagination and sort filters; omit for server defaults. */
    filters?: ConsultantsListFilters
}

/** Apollo response shape for the `consultants` query. */
export interface QueryConsultantsResponse {
    /** Top-level `consultants` field wrapping the standard API response. */
    consultants: GraphQLResponse<QueryConsultantsPayload>
}

/** Default sort order type for the consultants list. */
export type DefaultConsultantsListSorts = Array<SortInput<string>>
