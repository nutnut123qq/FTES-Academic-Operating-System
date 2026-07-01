import type { GraphQLResponse } from "../../types"
import type { FoundationCategoryEntity } from "@/modules/types/entities/foundation-category"

/** Pagination + search request for the `foundationCategories` query. */
export interface QueryFoundationCategoriesRequest {
    /** 1-based page number (default 1). */
    pageNumber?: number
    /** Items per page (default 10). */
    limit?: number
    /** Optional search string matched against title + description. */
    search?: string
}

/** Paginated payload returned by the `foundationCategories` query. */
export interface FoundationCategoriesPayload {
    /** Total matching categories across all pages. */
    totalCount: number
    /** Categories for the requested page. */
    data: Array<FoundationCategoryEntity>
}

/** Apollo response shape for the `foundationCategories` query. */
export interface QueryFoundationCategoriesResponse {
    /** Top-level `foundationCategories` field wrapping the paginated payload. */
    foundationCategories: GraphQLResponse<FoundationCategoriesPayload>
}
