import useSWRMutation from "swr/mutation"
import {
    publishChallenge,
    type ChallengeView,
} from "@/modules/api/rest/challenges"

/**
 * SWR mutation wrapper for {@link publishChallenge}.
 */
export const usePostPublishChallengeSwr = () => {
    const swr = useSWRMutation<
        ChallengeView,
        Error,
        string,
        string
    >(
        "POST_PUBLISH_CHALLENGE_SWR",
        async (_key, { arg: id }) => {
            return publishChallenge(id)
        },
    )

    return swr
}
