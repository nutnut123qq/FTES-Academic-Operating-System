import useSWRMutation from "swr/mutation"
import {
    addLessonBookmark,
    type BookmarkRequest,
    type BookmarkView,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostAddLessonBookmarkSwr}.
 */
export interface AddLessonBookmarkParams {
    lessonId: string
    request: BookmarkRequest
}

/**
 * SWR mutation wrapper for {@link addLessonBookmark}.
 */
export const usePostAddLessonBookmarkSwr = () => {
    const swr = useSWRMutation<
        BookmarkView,
        Error,
        string,
        AddLessonBookmarkParams
    >(
        "POST_ADD_LESSON_BOOKMARK_SWR",
        async (_key, { arg }) => {
            return addLessonBookmark(arg.lessonId, arg.request)
        },
    )

    return swr
}
