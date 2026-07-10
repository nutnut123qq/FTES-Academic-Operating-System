import useSWRMutation from "swr/mutation"
import {
    saveAnswer,
    type AnswerSavedView,
    type SaveAnswerParams,
} from "@/modules/api/rest/mockinterview"

/**
 * SWR mutation wrapper for {@link saveAnswer}.
 */
export const usePostSaveMockInterviewAnswerSwr = () => {
    const swr = useSWRMutation<AnswerSavedView, Error, string, SaveAnswerParams>(
        "POST_SAVE_MOCK_INTERVIEW_ANSWER_SWR",
        async (_key, { arg }) => {
            return saveAnswer(arg.sessionId, arg.request)
        },
    )

    return swr
}
