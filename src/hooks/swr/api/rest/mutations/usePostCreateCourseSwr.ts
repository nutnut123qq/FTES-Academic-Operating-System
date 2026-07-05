import useSWRMutation from "swr/mutation"
import {
    createCourse,
    type CreateCourseRequest,
    type IdResponse,
} from "@/modules/api/rest/course"

/**
 * SWR mutation wrapper for {@link createCourse}.
 */
export const usePostCreateCourseSwr = () => {
    const swr = useSWRMutation<
        IdResponse,
        Error,
        string,
        CreateCourseRequest
    >(
        "POST_CREATE_COURSE_SWR",
        async (_key, { arg }) => {
            return createCourse(arg)
        },
    )

    return swr
}
