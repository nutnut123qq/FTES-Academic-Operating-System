import useSWRMutation from "swr/mutation"
import {
    addQuizQuestion,
    type CreateQuestionRequest,
    type IdResponse,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostAddQuizQuestionSwr}.
 */
export interface AddQuizQuestionParams {
    quizId: string
    request: CreateQuestionRequest
}

/**
 * SWR mutation wrapper for {@link addQuizQuestion}.
 */
export const usePostAddQuizQuestionSwr = () => {
    const swr = useSWRMutation<
        IdResponse,
        Error,
        string,
        AddQuizQuestionParams
    >(
        "POST_ADD_QUIZ_QUESTION_SWR",
        async (_key, { arg }) => {
            return addQuizQuestion(arg.quizId, arg.request)
        },
    )

    return swr
}
