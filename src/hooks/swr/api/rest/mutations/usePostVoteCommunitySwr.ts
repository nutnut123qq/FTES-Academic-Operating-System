import useSWRMutation from "swr/mutation"
import { vote, type VoteRequest } from "@/modules/api/rest/community"

/**
 * SWR mutation wrapper for {@link vote}.
 */
export const usePostVoteCommunitySwr = () => {
    const swr = useSWRMutation<void, Error, string, VoteRequest>(
        "POST_VOTE_COMMUNITY_SWR",
        async (_key, { arg }) => {
            return vote(arg)
        },
    )

    return swr
}
