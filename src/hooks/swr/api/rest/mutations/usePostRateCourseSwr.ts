import useSWRMutation from "swr/mutation"
import {
    rateCourse,
    type CourseRatingItem,
    type CourseRatingRequest,
} from "@/modules/api/rest/course"

/** Params for {@link usePostRateCourseSwr}. */
export interface RateCourseParams {
    courseId: string
    request: CourseRatingRequest
}

/**
 * SWR mutation wrapper for {@link rateCourse} (upsert the viewer's rating).
 */
export const usePostRateCourseSwr = () => {
    const swr = useSWRMutation<
        CourseRatingItem,
        Error,
        string,
        RateCourseParams
    >(
        "POST_RATE_COURSE_SWR",
        async (_key, { arg }) => {
            return rateCourse(arg.courseId, arg.request)
        },
    )

    return swr
}
