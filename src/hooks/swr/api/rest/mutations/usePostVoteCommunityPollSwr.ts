import useSWRMutation from "swr/mutation"
import {
    votePoll,
    type PollVoteRequest,
} from "@/modules/api/rest/community"

/**
 * SWR mutation wrapper for {@link votePoll}.
 */
export const usePostVoteCommunityPollSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { id: string; request: PollVoteRequest }
    >(
        "POST_VOTE_COMMUNITY_POLL_SWR",
        async (_key, { arg }) => {
            return votePoll(arg.id, arg.request)
        },
    )

    return swr
}
