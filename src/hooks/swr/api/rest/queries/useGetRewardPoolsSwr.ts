"use client"

import useSWR from "swr"
import {
    listRewardPools,
    type RewardPoolResponse,
} from "@/modules/api/rest/gamification"

/**
 * SWR query wrapper for {@link listRewardPools}.
 */
export const useGetRewardPoolsSwr = () => {
    const swr = useSWR<Array<RewardPoolResponse>, Error>(
        ["GET_REWARD_POOLS_SWR"],
        () => listRewardPools(),
    )

    return swr
}
