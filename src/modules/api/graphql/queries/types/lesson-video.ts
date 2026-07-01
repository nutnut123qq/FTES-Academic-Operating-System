import type { GraphQLResponse } from "../../types"
import type { LessonVideoEntity } from "@/modules/types/entities/lesson-video"

/** Apollo response shape for the `lessonVideo` query. */
export interface QueryLessonVideoResponse {
    /** Top-level `lessonVideo` field wrapping the standard API response. */
    lessonVideo: GraphQLResponse<LessonVideoEntity>
}

/** Request body for the `lessonVideo` query (mirrors GraphQL `LessonVideoRequest`). */
export interface LessonVideoRequest {
    /** Primary identifier of the lesson video to fetch. */
    id: string
}
