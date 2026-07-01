import useSWR from "swr"
import { queryMyRewardWallet } from "@/modules/api/graphql/queries/query-my-reward-wallet"
import type { QueryMyRewardWalletData } from "@/modules/api/graphql/queries/types/my-reward-wallet"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR wrapper for {@link queryMyRewardWallet}. `data` is the viewer's reward
 * wallet (điểm quà balance + redemption history), or `null`. User-scoped — only
 * runs once the viewer is authenticated.
 */
export const useQueryMyRewardWalletSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<QueryMyRewardWalletData | null>(
        authenticated ? ["QUERY_MY_REWARD_WALLET_SWR"] : null,
        async () => {
            // unwrap the standard API envelope; null when absent
            const result = await queryMyRewardWallet({})
            return result.data?.myRewardWallet?.data ?? null
        },
    )
}
