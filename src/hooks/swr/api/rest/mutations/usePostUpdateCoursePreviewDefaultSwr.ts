import useSWRMutation from "swr/mutation"
import {
    updateCoursePreviewDefault,
    type UpdatePreviewDefaultRequest,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostUpdateCoursePreviewDefaultSwr}.
 */
export interface UpdateCoursePreviewDefaultParams {
    courseId: string
    request: UpdatePreviewDefaultRequest
}

/**
 * SWR mutation wrapper for {@link updateCoursePreviewDefault}.
 */
export const usePostUpdateCoursePreviewDefaultSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        UpdateCoursePreviewDefaultParams
    >(
        "POST_UPDATE_COURSE_PREVIEW_DEFAULT_SWR",
        async (_key, { arg }) => {
            return updateCoursePreviewDefault(arg.courseId, arg.request)
        },
    )

    return swr
}
