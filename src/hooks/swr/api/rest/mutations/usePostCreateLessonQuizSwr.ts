import useSWRMutation from "swr/mutation"
import {
    createLessonQuiz,
    type CreateQuizRequest,
    type IdResponse,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostCreateLessonQuizSwr}.
 */
export interface CreateLessonQuizParams {
    lessonId: string
    request: CreateQuizRequest
}

/**
 * SWR mutation wrapper for {@link createLessonQuiz}.
 */
export const usePostCreateLessonQuizSwr = () => {
    const swr = useSWRMutation<
        IdResponse,
        Error,
        string,
        CreateLessonQuizParams
    >(
        "POST_CREATE_LESSON_QUIZ_SWR",
        async (_key, { arg }) => {
            return createLessonQuiz(arg.lessonId, arg.request)
        },
    )

    return swr
}
