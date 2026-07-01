import type { GraphQLResponse } from "../../types"
import type { EnrollmentEntity } from "@/modules/types/entities/enrollment"

/** Payload inside `courseEnrollmentStatus.data` after the standard API wrapper. */
export interface CourseEnrollmentStatusData {
    /** Whether the current authenticated user is enrolled in the course. */
    isEnrolled: boolean
    /** Full enrollment record when `isEnrolled` is true; absent otherwise. */
    enrollment?: EnrollmentEntity
}

/** Apollo variables for `courseEnrollmentStatus(request: CourseEnrollmentStatusRequest!)`. */
export interface QueryCourseEnrollmentStatusRequest {
    /** The course whose enrollment status should be checked. */
    courseId: string
}

/** Apollo response shape for the `courseEnrollmentStatus` query. */
export interface QueryCourseEnrollmentStatusResponse {
    /** Top-level `courseEnrollmentStatus` field wrapping the standard API response. */
    courseEnrollmentStatus: GraphQLResponse<CourseEnrollmentStatusData>
}
