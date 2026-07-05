import useSWRMutation from "swr/mutation"
import {
    updateCourseSection,
    type IdResponse,
    type UpdateSectionRequest,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostUpdateCourseSectionSwr}.
 */
export interface UpdateCourseSectionParams {
    sectionId: string
    request: UpdateSectionRequest
}

/**
 * SWR mutation wrapper for {@link updateCourseSection}.
 */
export const usePostUpdateCourseSectionSwr = () => {
    const swr = useSWRMutation<
        IdResponse,
        Error,
        string,
        UpdateCourseSectionParams
    >(
        "POST_UPDATE_COURSE_SECTION_SWR",
        async (_key, { arg }) => {
            return updateCourseSection(arg.sectionId, arg.request)
        },
    )

    return swr
}
