"use client"

import useSWR from "swr"
import { validateRewardPool } from "@/modules/api/rest/gamification"

/**
 * SWR query wrapper for {@link validateRewardPool}.
 */
export const useGetValidateRewardPoolSwr = (poolId: string) => {
    const swr = useSWR<boolean, Error>(
        ["GET_VALIDATE_REWARD_POOL_SWR", poolId],
        () => validateRewardPool(poolId),
    )

    return swr
}
