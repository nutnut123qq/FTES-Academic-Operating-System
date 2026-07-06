import useSWRMutation from "swr/mutation"
import {
    decideModeration,
    type ModerationDecisionRequest,
} from "@/modules/api/rest/community"

/**
 * SWR mutation wrapper for {@link decideModeration}.
 */
export const usePostDecideCommunityModerationSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { id: string; request: ModerationDecisionRequest }
    >(
        "POST_DECIDE_COMMUNITY_MODERATION_SWR",
        async (_key, { arg }) => {
            return decideModeration(arg.id, arg.request)
        },
    )

    return swr
}
