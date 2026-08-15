"use client"

import useSWR from "swr"
import {
    getMyPersonalizeConsent,
    type RecommendationConsentView,
} from "@/modules/api/rest/recommendation"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's personalisation consent flag. */
export const MY_PERSONALIZE_CONSENT_SWR_KEY = "GET_MY_PERSONALIZE_CONSENT_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyPersonalizeConsentSwr}. `null`
 * disables the fetch (guest, or the `me` query still in flight). Import this from a
 * call site that needs to `mutate` the entry — never hand-write the tuple.
 */
export const myPersonalizeConsentKey = (viewerId: string | null) =>
    viewerId ? ([MY_PERSONALIZE_CONSENT_SWR_KEY, viewerId] as const) : null

/**
 * SWR query wrapper for {@link getMyPersonalizeConsent}.
 *
 * The key carries the VIEWER ID. This one is a CONSENT record: reading A's cached "yes"
 * for B does not just mis-paint a toggle, it makes the UI behave as though B agreed to
 * personalised tracking when B never did.
 */
export const useGetMyPersonalizeConsentSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<RecommendationConsentView, Error>(
        authenticated ? myPersonalizeConsentKey(viewerId) : null,
        () => getMyPersonalizeConsent(),
    )

    return swr
}
