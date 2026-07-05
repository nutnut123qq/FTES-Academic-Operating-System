import useSWRMutation from "swr/mutation"
import {
    createChallenge,
    type ChallengeView,
    type CreateChallengeRequest,
} from "@/modules/api/rest/challenges"

/**
 * SWR mutation wrapper for {@link createChallenge}.
 */
export const usePostCreateChallengeSwr = () => {
    const swr = useSWRMutation<
        ChallengeView,
        Error,
        string,
        CreateChallengeRequest
    >(
        "POST_CREATE_CHALLENGE_SWR",
        async (_key, { arg }) => {
            return createChallenge(arg)
        },
    )

    return swr
}
