import useSWRMutation from "swr/mutation"
import {
    upsertLessonContent,
    type UpsertContentRequest,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostUpsertLessonContentSwr}.
 */
export interface UpsertLessonContentParams {
    lessonId: string
    request: UpsertContentRequest
}

/**
 * SWR mutation wrapper for {@link upsertLessonContent}.
 */
export const usePostUpsertLessonContentSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        UpsertLessonContentParams
    >(
        "POST_UPSERT_LESSON_CONTENT_SWR",
        async (_key, { arg }) => {
            return upsertLessonContent(arg.lessonId, arg.request)
        },
    )

    return swr
}
