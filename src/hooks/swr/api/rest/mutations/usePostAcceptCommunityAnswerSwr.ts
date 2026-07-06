import useSWRMutation from "swr/mutation"
import {
    acceptAnswer,
    type AcceptedAnswerRequest,
} from "@/modules/api/rest/community"

/**
 * SWR mutation wrapper for {@link acceptAnswer}.
 */
export const usePostAcceptCommunityAnswerSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { postId: string; request: AcceptedAnswerRequest }
    >(
        "POST_ACCEPT_COMMUNITY_ANSWER_SWR",
        async (_key, { arg }) => {
            return acceptAnswer(arg.postId, arg.request)
        },
    )

    return swr
}
