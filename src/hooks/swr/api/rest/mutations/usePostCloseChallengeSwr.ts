import useSWRMutation from "swr/mutation"
import { closeChallenge } from "@/modules/api/rest/challenges"

/**
 * SWR mutation wrapper for {@link closeChallenge}.
 */
export const usePostCloseChallengeSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        string
    >(
        "POST_CLOSE_CHALLENGE_SWR",
        async (_key, { arg: id }) => {
            return closeChallenge(id)
        },
    )

    return swr
}
