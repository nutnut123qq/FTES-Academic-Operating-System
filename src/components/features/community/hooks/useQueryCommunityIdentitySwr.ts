"use client"

import useSWR from "swr"

/** Community hub identity (§6, mock until BE lands). Scope tabs are route
 * segments — identity lives at the HUB level only (no per-scope banner). */
export interface CommunityIdentity {
    name: string
    /** Community avatar URL; null = no avatar yet (UI falls back to initials). */
    avatarUrl: string | null
    /** Community cover/banner URL; null = no cover yet (UI falls back to a gradient). */
    coverUrl: string | null
    members: number
}

// ponytail: mock BE — no community identity endpoint yet. Deterministic picsum seeds.
const fetchCommunityIdentityMock = async (): Promise<CommunityIdentity> => ({
    name: "Cộng đồng FTES",
    avatarUrl: "https://picsum.photos/seed/community-avatar/200/200",
    coverUrl: "https://picsum.photos/seed/community-cover/1500/300",
    members: 12480,
})

/** Loads the community hub identity. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryCommunityIdentitySwr = () => {
    const { data, isLoading, error } = useSWR(["community-identity"], () =>
        fetchCommunityIdentityMock(),
    )
    return { identity: data, isLoading, error }
}
