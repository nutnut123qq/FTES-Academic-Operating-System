import useSWRMutation from "swr/mutation"
import {
    addRewardPoolItem,
    type RewardItemRequest,
    type RewardItemResponse,
} from "@/modules/api/rest/gamification"

/**
 * SWR mutation wrapper for {@link addRewardPoolItem}.
 */
export const usePostAddRewardPoolItemSwr = () => {
    const swr = useSWRMutation<
        RewardItemResponse,
        Error,
        string,
        { poolId: string; request: RewardItemRequest }
    >("POST_ADD_REWARD_POOL_ITEM_SWR", async (_key, { arg }) => {
        return addRewardPoolItem(arg.poolId, arg.request)
    })

    return swr
}
