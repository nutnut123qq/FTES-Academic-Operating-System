import useSWRMutation from "swr/mutation"
import {
    startQuizAttempt,
    type QuizAttemptStartView,
} from "@/modules/api/rest/course"

/**
 * SWR mutation wrapper for {@link startQuizAttempt}.
 */
export const usePostStartQuizAttemptSwr = () => {
    const swr = useSWRMutation<
        QuizAttemptStartView,
        Error,
        string,
        string
    >(
        "POST_START_QUIZ_ATTEMPT_SWR",
        async (_key, { arg: quizId }) => {
            return startQuizAttempt(quizId)
        },
    )

    return swr
}
