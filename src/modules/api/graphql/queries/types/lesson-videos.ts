import type { GraphQLResponse, PaginationFilters, SortInput } from "../../types"
import type { LessonVideoEntity } from "@/modules/types/entities/lesson-video"

/** Paginated payload inside `lessonVideos.data`. */
export interface QueryLessonVideosPayload {
    /** Total number of lesson video rows matching the filter. */
    count: number
    /** Array of lesson video entity rows for the current page. */
    data: Array<LessonVideoEntity>
}

/** Pagination and sort filters for the lesson videos list. */
export type LessonVideosListFilters = PaginationFilters<string>

/** Apollo variables for `lessonVideos(request: LessonVideosRequest!)`. */
export interface LessonVideosListRequest {
    /** Scopes the list to lesson videos belonging to this content id. */
    contentId: string
    /** Pagination and sort filters for the lesson videos list. */
    filters: LessonVideosListFilters
}

/** Apollo response shape for the `lessonVideos` query. */
export interface QueryLessonVideosResponse {
    /** Top-level `lessonVideos` field wrapping the standard API response. */
    lessonVideos: GraphQLResponse<QueryLessonVideosPayload>
}

/** Default sort order type for the lesson videos list. */
export type DefaultLessonVideosListSorts = Array<SortInput<string>>
