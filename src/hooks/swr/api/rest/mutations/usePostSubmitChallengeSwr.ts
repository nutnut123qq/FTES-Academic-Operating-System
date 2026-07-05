import useSWRMutation from "swr/mutation"
import {
    submitChallenge,
    type SubmitRequest,
    type SubmissionView,
} from "@/modules/api/rest/challenges"

/**
 * Params for {@link usePostSubmitChallengeSwr}.
 */
export interface SubmitChallengeParams {
    /** Challenge id. */
    id: string
    /** Submission body. */
    request: SubmitRequest
}

/**
 * SWR mutation wrapper for {@link submitChallenge}.
 */
export const usePostSubmitChallengeSwr = () => {
    const swr = useSWRMutation<
        SubmissionView,
        Error,
        string,
        SubmitChallengeParams
    >(
        "POST_SUBMIT_CHALLENGE_SWR",
        async (_key, { arg }) => {
            return submitChallenge(arg.id, arg.request)
        },
    )

    return swr
}
