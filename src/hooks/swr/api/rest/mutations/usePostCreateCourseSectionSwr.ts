import useSWRMutation from "swr/mutation"
import {
    createCourseSection,
    type CreateSectionRequest,
    type IdResponse,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostCreateCourseSectionSwr}.
 */
export interface CreateCourseSectionParams {
    id: string
    request: CreateSectionRequest
}

/**
 * SWR mutation wrapper for {@link createCourseSection}.
 */
export const usePostCreateCourseSectionSwr = () => {
    const swr = useSWRMutation<
        IdResponse,
        Error,
        string,
        CreateCourseSectionParams
    >(
        "POST_CREATE_COURSE_SECTION_SWR",
        async (_key, { arg }) => {
            return createCourseSection(arg.id, arg.request)
        },
    )

    return swr
}
