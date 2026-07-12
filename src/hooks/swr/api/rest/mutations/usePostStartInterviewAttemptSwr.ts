import useSWRMutation from "swr/mutation"
import {
    startInterviewAttempt,
    type StartAttemptRequest,
    type StartAttemptView,
} from "@/modules/api/rest/interview"

/**
 * SWR mutation wrapper for {@link startInterviewAttempt}.
 */
export const usePostStartInterviewAttemptSwr = () => {
    const swr = useSWRMutation<StartAttemptView, Error, string, StartAttemptRequest>(
        "POST_START_INTERVIEW_ATTEMPT_SWR",
        async (_key, { arg }) => {
            return startInterviewAttempt(arg)
        },
    )

    return swr
}
