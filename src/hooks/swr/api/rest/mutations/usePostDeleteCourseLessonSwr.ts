import useSWRMutation from "swr/mutation"
import { deleteCourseLesson } from "@/modules/api/rest/course"

/**
 * SWR mutation wrapper for {@link deleteCourseLesson}.
 */
export const usePostDeleteCourseLessonSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        string
    >(
        "POST_DELETE_COURSE_LESSON_SWR",
        async (_key, { arg: lessonId }) => {
            return deleteCourseLesson(lessonId)
        },
    )

    return swr
}
