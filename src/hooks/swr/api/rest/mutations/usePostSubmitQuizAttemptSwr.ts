import useSWRMutation from "swr/mutation"
import {
    submitQuizAttempt,
    type QuizAttemptResultView,
    type SubmitQuizRequest,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostSubmitQuizAttemptSwr}.
 */
export interface SubmitQuizAttemptParams {
    attemptId: string
    request: SubmitQuizRequest
}

/**
 * SWR mutation wrapper for {@link submitQuizAttempt}.
 */
export const usePostSubmitQuizAttemptSwr = () => {
    const swr = useSWRMutation<
        QuizAttemptResultView,
        Error,
        string,
        SubmitQuizAttemptParams
    >(
        "POST_SUBMIT_QUIZ_ATTEMPT_SWR",
        async (_key, { arg }) => {
            return submitQuizAttempt(arg.attemptId, arg.request)
        },
    )

    return swr
}
