import useSWRMutation from "swr/mutation"
import {
    updateCourse,
    type IdResponse,
    type UpdateCourseRequest,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostUpdateCourseSwr}.
 */
export interface UpdateCourseParams {
    id: string
    request: UpdateCourseRequest
}

/**
 * SWR mutation wrapper for {@link updateCourse}.
 */
export const usePostUpdateCourseSwr = () => {
    const swr = useSWRMutation<
        IdResponse,
        Error,
        string,
        UpdateCourseParams
    >(
        "POST_UPDATE_COURSE_SWR",
        async (_key, { arg }) => {
            return updateCourse(arg.id, arg.request)
        },
    )

    return swr
}
