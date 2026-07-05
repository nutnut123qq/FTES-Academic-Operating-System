import useSWRMutation from "swr/mutation"
import {
    updateLessonAiChatLimit,
    type LessonAiChatLimitRequest,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostUpdateLessonAiChatLimitSwr}.
 */
export interface UpdateLessonAiChatLimitParams {
    lessonId: string
    request: LessonAiChatLimitRequest
}

/**
 * SWR mutation wrapper for {@link updateLessonAiChatLimit}.
 */
export const usePostUpdateLessonAiChatLimitSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        UpdateLessonAiChatLimitParams
    >(
        "POST_UPDATE_LESSON_AI_CHAT_LIMIT_SWR",
        async (_key, { arg }) => {
            return updateLessonAiChatLimit(arg.lessonId, arg.request)
        },
    )

    return swr
}
