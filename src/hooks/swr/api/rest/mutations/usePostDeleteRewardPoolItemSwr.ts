import useSWRMutation from "swr/mutation"
import { deleteRewardPoolItem } from "@/modules/api/rest/gamification"

/**
 * SWR mutation wrapper for {@link deleteRewardPoolItem}.
 */
export const usePostDeleteRewardPoolItemSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_DELETE_REWARD_POOL_ITEM_SWR",
        async (_key, { arg }) => {
            return deleteRewardPoolItem(arg)
        },
    )

    return swr
}
