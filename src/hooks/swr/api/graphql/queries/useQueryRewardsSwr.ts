import useSWR from "swr"
import { queryRewards } from "@/modules/api/graphql/queries/query-rewards"
import type { QueryRewardData } from "@/modules/api/graphql/queries/types/rewards"

/**
 * SWR wrapper for {@link queryRewards}. `data` is the catalog of redeemable
 * rewards (gifts store), or `null`.
 */
export const useQueryRewardsSwr = () => {
    return useSWR<QueryRewardData[] | null>(
        ["QUERY_REWARDS_SWR"],
        async () => {
            // unwrap the standard API envelope; null when absent
            const result = await queryRewards({})
            return result.data?.rewards?.data ?? null
        },
    )
}
