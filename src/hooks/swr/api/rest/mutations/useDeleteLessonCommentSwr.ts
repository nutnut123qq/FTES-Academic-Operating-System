import useSWRMutation from "swr/mutation"
import { deleteLessonComment } from "@/modules/api/rest/course"

/**
 * SWR mutation wrapper for {@link deleteLessonComment}. Arg is the comment id.
 */
export const useDeleteLessonCommentSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "DELETE_LESSON_COMMENT_SWR",
        async (_key, { arg }) => {
            return deleteLessonComment(arg)
        },
    )

    return swr
}
