import useSWRMutation from "swr/mutation"
import { unreactLessonComment } from "@/modules/api/rest/course"
import type { ReactLessonCommentParams } from "./usePostReactLessonCommentSwr"

/**
 * SWR mutation wrapper for {@link unreactLessonComment} (remove an emoji reaction).
 */
export const useDeleteReactLessonCommentSwr = () => {
    const swr = useSWRMutation<void, Error, string, ReactLessonCommentParams>(
        "DELETE_REACT_LESSON_COMMENT_SWR",
        async (_key, { arg }) => {
            return unreactLessonComment(arg.commentId, arg.emoji)
        },
    )

    return swr
}
