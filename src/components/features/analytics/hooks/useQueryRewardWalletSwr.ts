"use client"

import useSWR from "swr"
import { getMyWallet } from "@/modules/api/rest/wallet"

/** The viewer's reward wallet. */
export interface RewardWallet {
    /** Spendable reward-point balance. */
    balance: number
}

/** Loads the viewer's spendable balance from the real wallet REST API (`GET /wallet/me`). */
export const useQueryRewardWalletSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["analytics", "overview", "reward"],
        async (): Promise<RewardWallet> => {
            const wallet = await getMyWallet()
            return { balance: wallet.balance ?? 0 }
        },
    )
    return { data, isLoading, error, mutate }
}
