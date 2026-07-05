import useSWRMutation from "swr/mutation"
import {
    updateLessonPreview,
    type UpdatePreviewRequest,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostUpdateLessonPreviewSwr}.
 */
export interface UpdateLessonPreviewParams {
    lessonId: string
    request: UpdatePreviewRequest
}

/**
 * SWR mutation wrapper for {@link updateLessonPreview}.
 */
export const usePostUpdateLessonPreviewSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        UpdateLessonPreviewParams
    >(
        "POST_UPDATE_LESSON_PREVIEW_SWR",
        async (_key, { arg }) => {
            return updateLessonPreview(arg.lessonId, arg.request)
        },
    )

    return swr
}
