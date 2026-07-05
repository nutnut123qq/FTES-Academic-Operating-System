import useSWRMutation from "swr/mutation"
import { enrollCourseDirect, type EnrollResponse } from "@/modules/api/rest/course"

/**
 * SWR mutation wrapper for {@link enrollCourseDirect}.
 */
export const usePostEnrollCourseDirectSwr = () => {
    const swr = useSWRMutation<
        EnrollResponse,
        Error,
        string,
        string
    >(
        "POST_ENROLL_COURSE_DIRECT_SWR",
        async (_key, { arg: id }) => {
            return enrollCourseDirect(id)
        },
    )

    return swr
}
