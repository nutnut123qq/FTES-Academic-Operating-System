import useSWRMutation from "swr/mutation"
import { archiveCourse, type IdResponse } from "@/modules/api/rest/course"

/**
 * SWR mutation wrapper for {@link archiveCourse}.
 */
export const usePostArchiveCourseSwr = () => {
    const swr = useSWRMutation<
        IdResponse,
        Error,
        string,
        string
    >(
        "POST_ARCHIVE_COURSE_SWR",
        async (_key, { arg: id }) => {
            return archiveCourse(id)
        },
    )

    return swr
}
