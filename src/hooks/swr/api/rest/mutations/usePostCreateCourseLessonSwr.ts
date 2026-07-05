import useSWRMutation from "swr/mutation"
import {
    createCourseLesson,
    type CreateLessonRequest,
    type IdResponse,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostCreateCourseLessonSwr}.
 */
export interface CreateCourseLessonParams {
    sectionId: string
    request: CreateLessonRequest
}

/**
 * SWR mutation wrapper for {@link createCourseLesson}.
 */
export const usePostCreateCourseLessonSwr = () => {
    const swr = useSWRMutation<
        IdResponse,
        Error,
        string,
        CreateCourseLessonParams
    >(
        "POST_CREATE_COURSE_LESSON_SWR",
        async (_key, { arg }) => {
            return createCourseLesson(arg.sectionId, arg.request)
        },
    )

    return swr
}
