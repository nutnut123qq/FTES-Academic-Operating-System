import useSWRMutation from "swr/mutation"
import {
    claimRewardPool,
    type ClaimRequest,
    type ClaimResultView,
} from "@/modules/api/rest/gamification"

/**
 * SWR mutation wrapper for {@link claimRewardPool}.
 */
export const usePostClaimRewardPoolSwr = () => {
    const swr = useSWRMutation<
        ClaimResultView,
        Error,
        string,
        { code: string; request?: ClaimRequest }
    >("POST_CLAIM_REWARD_POOL_SWR", async (_key, { arg }) => {
        return claimRewardPool(arg.code, arg.request)
    })

    return swr
}
