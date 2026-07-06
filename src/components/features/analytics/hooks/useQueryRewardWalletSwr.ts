"use client"

import useSWR from "swr"

/** The viewer's reward wallet. */
export interface RewardWallet {
    /** Spendable reward-point balance. */
    balance: number
}

// ponytail: mock BE — no reward-wallet endpoint yet. Deterministic sample;
// SWR-shaped for a drop-in swap (myRewardWallet()) later.
const fetchRewardWalletMock = async (): Promise<RewardWallet> => ({
    balance: 1840,
})

/** Loads the viewer's reward-point balance. Mocked; SWR-shaped. */
export const useQueryRewardWalletSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["analytics", "overview", "reward"],
        () => fetchRewardWalletMock(),
    )
    return { data, isLoading, error, mutate }
}
