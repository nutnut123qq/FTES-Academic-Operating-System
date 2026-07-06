"use client"

import useSWR from "swr"

/** The viewer's identity + standing shown in the dashboard left card. */
export interface OverviewIdentity {
    username: string
    /** Display name shown under the avatar. */
    name: string
    /** Uploaded avatar URL (null → generated fallback via UserAvatar). */
    avatar: string | null
    /** Current daily streak (days in a row). */
    streak: number
    /** Remaining AI credit in the current window. */
    aiCreditRemaining: number
    /** AI credit ceiling for the window (e.g. 250). */
    aiCreditLimit: number
    /** Spendable reward points / coins. */
    rewardPoints: number
}

// ponytail: mock BE — no identity/standing endpoint yet. Deterministic sample,
// SWR-shaped so it can drop-in swap for a real query (myOverviewIdentity()) later.
const fetchOverviewIdentityMock = async (): Promise<OverviewIdentity> => ({
    username: "minh_dev",
    name: "Minh Nguyen",
    avatar: null,
    streak: 12,
    aiCreditRemaining: 250,
    aiCreditLimit: 250,
    rewardPoints: 1840,
})

/** Loads the viewer's dashboard identity + standing. Mocked; SWR-shaped. */
export const useQueryOverviewIdentitySwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["analytics", "overview", "identity"],
        () => fetchOverviewIdentityMock(),
    )
    return { data, isLoading, error, mutate }
}
