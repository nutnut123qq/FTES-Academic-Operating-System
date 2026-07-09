import useSWRMutation from "swr/mutation"
import { deleteCourseRating } from "@/modules/api/rest/course"

/**
 * SWR mutation wrapper for {@link deleteCourseRating}. Arg is the course UUID
 * (`course.rawId`).
 */
export const useDeleteCourseRatingSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "DELETE_COURSE_RATING_SWR",
        async (_key, { arg }) => {
            return deleteCourseRating(arg)
        },
    )

    return swr
}
