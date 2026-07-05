import useSWRMutation from "swr/mutation"
import {
    updateCourseLesson,
    type IdResponse,
    type UpdateLessonRequest,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostUpdateCourseLessonSwr}.
 */
export interface UpdateCourseLessonParams {
    lessonId: string
    request: UpdateLessonRequest
}

/**
 * SWR mutation wrapper for {@link updateCourseLesson}.
 */
export const usePostUpdateCourseLessonSwr = () => {
    const swr = useSWRMutation<
        IdResponse,
        Error,
        string,
        UpdateCourseLessonParams
    >(
        "POST_UPDATE_COURSE_LESSON_SWR",
        async (_key, { arg }) => {
            return updateCourseLesson(arg.lessonId, arg.request)
        },
    )

    return swr
}
