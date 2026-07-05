import useSWRMutation from "swr/mutation"
import { publishCourse, type IdResponse } from "@/modules/api/rest/course"

/**
 * SWR mutation wrapper for {@link publishCourse}.
 */
export const usePostPublishCourseSwr = () => {
    const swr = useSWRMutation<
        IdResponse,
        Error,
        string,
        string
    >(
        "POST_PUBLISH_COURSE_SWR",
        async (_key, { arg: id }) => {
            return publishCourse(id)
        },
    )

    return swr
}
