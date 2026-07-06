import useSWRMutation from "swr/mutation"
import {
    upsertRewardPool,
    type RewardPoolRequest,
    type RewardPoolResponse,
} from "@/modules/api/rest/gamification"

/**
 * SWR mutation wrapper for {@link upsertRewardPool}.
 */
export const usePostUpsertRewardPoolSwr = () => {
    const swr = useSWRMutation<
        RewardPoolResponse,
        Error,
        string,
        RewardPoolRequest
    >("POST_UPSERT_REWARD_POOL_SWR", async (_key, { arg }) => {
        return upsertRewardPool(arg)
    })

    return swr
}
