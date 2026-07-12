import useSWRMutation from "swr/mutation"
import {
    submitInterviewAnswerFromParams,
    type SubmitAnswerParams,
    type SubmitAnswerView,
} from "@/modules/api/rest/interview"

/**
 * SWR mutation wrapper for {@link submitInterviewAnswer}.
 */
export const usePostSubmitInterviewAnswerSwr = () => {
    const swr = useSWRMutation<SubmitAnswerView, Error, string, SubmitAnswerParams>(
        "POST_SUBMIT_INTERVIEW_ANSWER_SWR",
        async (_key, { arg }) => {
            return submitInterviewAnswerFromParams(arg)
        },
    )

    return swr
}
