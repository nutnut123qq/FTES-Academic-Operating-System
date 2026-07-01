import type { GraphQLResponse } from "../../types"
import type { CourseEntity } from "@/modules/types/entities/course"

/** Apollo variables for `course(request: CourseRequest!)`. */
export interface QueryCourseRequest {
    /** The display id of the course to fetch. */
    displayId?: string
    /** The primary id of the course to fetch. */
    id?: string
}

/** Apollo response shape for the `course` query. */
export interface QueryCourseResponse {
    /** Top-level `course` field wrapping the standard API response. */
    course: GraphQLResponse<CourseEntity>
}
