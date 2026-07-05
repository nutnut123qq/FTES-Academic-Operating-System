import useSWRMutation from "swr/mutation"
import { deleteLessonBookmark } from "@/modules/api/rest/course"

/**
 * Params for {@link usePostDeleteLessonBookmarkSwr}.
 */
export interface DeleteLessonBookmarkParams {
    lessonId: string
    bookmarkId: string
}

/**
 * SWR mutation wrapper for {@link deleteLessonBookmark}.
 */
export const usePostDeleteLessonBookmarkSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        DeleteLessonBookmarkParams
    >(
        "POST_DELETE_LESSON_BOOKMARK_SWR",
        async (_key, { arg }) => {
            return deleteLessonBookmark(arg.lessonId, arg.bookmarkId)
        },
    )

    return swr
}
