"use client"

import useSWR from "swr"
import { getMyReferral, type ReferralView } from "@/modules/api/rest/wallet"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's referral code + invite stats. */
export const MY_REFERRAL_SWR_KEY = "GET_MY_REFERRAL_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyReferralSwr}. `null` disables the
 * fetch (guest, or the `me` query still in flight). Import this from a call site that
 * needs to `mutate` the entry — never hand-write the tuple.
 */
export const myReferralKey = (viewerId: string | null) =>
    viewerId ? ([MY_REFERRAL_SWR_KEY, viewerId] as const) : null

/**
 * SWR query wrapper for {@link getMyReferral}.
 *
 * The key carries the VIEWER ID. The referral payload is a PERSONAL CODE that credits
 * whoever owns it — served from a shared cache entry, B's invite modal would copy A's
 * code and hand A the rewards for B's invites.
 */
export const useGetMyReferralSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<ReferralView, Error>(
        authenticated ? myReferralKey(viewerId) : null,
        () => getMyReferral(),
    )

    return swr
}
