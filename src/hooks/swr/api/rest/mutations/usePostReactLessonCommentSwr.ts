import useSWRMutation from "swr/mutation"
import { reactLessonComment } from "@/modules/api/rest/course"

/** Params for {@link usePostReactLessonCommentSwr}. */
export interface ReactLessonCommentParams {
    commentId: string
    emoji: string
}

/**
 * SWR mutation wrapper for {@link reactLessonComment} (add an emoji reaction).
 */
export const usePostReactLessonCommentSwr = () => {
    const swr = useSWRMutation<void, Error, string, ReactLessonCommentParams>(
        "POST_REACT_LESSON_COMMENT_SWR",
        async (_key, { arg }) => {
            return reactLessonComment(arg.commentId, arg.emoji)
        },
    )

    return swr
}
