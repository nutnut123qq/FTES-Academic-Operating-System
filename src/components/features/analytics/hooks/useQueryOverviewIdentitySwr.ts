"use client"

import useSWR from "swr"

/** The viewer's identity shown in the dashboard identity anchor. */
export interface OverviewIdentity {
    username: string
    /** Display name shown next to the avatar. */
    name: string
    /** Uploaded avatar URL (null → generated fallback via UserAvatar). */
    avatar: string | null
}

// ponytail: mock BE — no identity endpoint yet. Deterministic sample, SWR-shaped so
// it can drop-in swap for a real query (myProfile()) later.
const fetchOverviewIdentityMock = async (): Promise<OverviewIdentity> => ({
    username: "minh_dev",
    name: "Minh Nguyen",
    avatar: null,
})

/** Loads the viewer's dashboard identity anchor. Mocked; SWR-shaped. */
export const useQueryOverviewIdentitySwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["analytics", "overview", "identity"],
        () => fetchOverviewIdentityMock(),
    )
    return { data, isLoading, error, mutate }
}
