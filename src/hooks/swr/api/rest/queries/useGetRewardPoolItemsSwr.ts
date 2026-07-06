"use client"

import useSWR from "swr"
import {
    listRewardPoolItems,
    type RewardItemResponse,
} from "@/modules/api/rest/gamification"

/**
 * SWR query wrapper for {@link listRewardPoolItems}.
 */
export const useGetRewardPoolItemsSwr = (poolId: string) => {
    const swr = useSWR<Array<RewardItemResponse>, Error>(
        ["GET_REWARD_POOL_ITEMS_SWR", poolId],
        () => listRewardPoolItems(poolId),
    )

    return swr
}
