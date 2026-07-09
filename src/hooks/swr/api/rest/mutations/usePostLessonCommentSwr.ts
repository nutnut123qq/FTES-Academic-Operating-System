import useSWRMutation from "swr/mutation"
import {
    postLessonComment,
    type LessonCommentView,
    type PostLessonCommentRequest,
} from "@/modules/api/rest/course"

/** Params for {@link usePostLessonCommentSwr}. */
export interface PostLessonCommentParams {
    lessonId: string
    request: PostLessonCommentRequest
}

/**
 * SWR mutation wrapper for {@link postLessonComment} (top-level comment or reply).
 */
export const usePostLessonCommentSwr = () => {
    const swr = useSWRMutation<
        LessonCommentView,
        Error,
        string,
        PostLessonCommentParams
    >(
        "POST_LESSON_COMMENT_SWR",
        async (_key, { arg }) => {
            return postLessonComment(arg.lessonId, arg.request)
        },
    )

    return swr
}
