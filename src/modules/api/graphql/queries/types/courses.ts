import type { GraphQLResponse, PaginationFilters } from "../../types"
import type { SortBy } from "../../types"
import type { CourseEntity } from "@/modules/types/entities/course"

/** Inner `data` field for the paginated `courses` query. */
export interface QueryCoursesPayload {
    /** Total number of courses matching the filter. */
    count: number
    /** Array of course entity rows for the current page. */
    data: Array<CourseEntity>
}

/** Apollo variables for `courses(request: CoursesRequest!)`. */
export interface QueryCoursesRequest {
    /** Pagination and sort filters for the courses list. */
    filters: PaginationFilters<SortBy>
}

/** Apollo response shape for the `courses` query. */
export interface QueryCoursesResponse {
    /** Top-level `courses` field wrapping the standard API response. */
    courses: GraphQLResponse<QueryCoursesPayload>
}
