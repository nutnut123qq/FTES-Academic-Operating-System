import useSWRMutation from "swr/mutation"
import { finishInterviewAttempt, type FinishAttemptView } from "@/modules/api/rest/interview"

/**
 * SWR mutation wrapper for {@link finishInterviewAttempt}.
 */
export const usePostFinishInterviewAttemptSwr = () => {
    const swr = useSWRMutation<FinishAttemptView, Error, string, string>(
        "POST_FINISH_INTERVIEW_ATTEMPT_SWR",
        async (_key, { arg }) => {
            return finishInterviewAttempt(arg)
        },
    )

    return swr
}
