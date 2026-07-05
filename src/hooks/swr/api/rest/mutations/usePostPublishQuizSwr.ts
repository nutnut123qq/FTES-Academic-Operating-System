import useSWRMutation from "swr/mutation"
import { publishQuiz, type IdResponse } from "@/modules/api/rest/course"

/**
 * SWR mutation wrapper for {@link publishQuiz}.
 */
export const usePostPublishQuizSwr = () => {
    const swr = useSWRMutation<
        IdResponse,
        Error,
        string,
        string
    >(
        "POST_PUBLISH_QUIZ_SWR",
        async (_key, { arg: quizId }) => {
            return publishQuiz(quizId)
        },
    )

    return swr
}
