import useSWRMutation from "swr/mutation"
import { markLessonComplete, type CompleteResponse } from "@/modules/api/rest/course"

/**
 * SWR mutation wrapper for {@link markLessonComplete}.
 */
export const usePostMarkLessonCompleteSwr = () => {
    const swr = useSWRMutation<
        CompleteResponse,
        Error,
        string,
        string
    >(
        "POST_MARK_LESSON_COMPLETE_SWR",
        async (_key, { arg: lessonId }) => {
            return markLessonComplete(lessonId)
        },
    )

    return swr
}
