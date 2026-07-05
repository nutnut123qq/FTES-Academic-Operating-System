import useSWRMutation from "swr/mutation"
import { deleteCourseSection } from "@/modules/api/rest/course"

/**
 * SWR mutation wrapper for {@link deleteCourseSection}.
 */
export const usePostDeleteCourseSectionSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        string
    >(
        "POST_DELETE_COURSE_SECTION_SWR",
        async (_key, { arg: sectionId }) => {
            return deleteCourseSection(sectionId)
        },
    )

    return swr
}
