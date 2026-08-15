"use client"

import useSWR from "swr"
import {
    getMyEventCertificates,
    type EventCertificateView,
} from "@/modules/api/rest/event"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's event attendance certificates. */
export const MY_EVENT_CERTIFICATES_SWR_KEY = "GET_MY_EVENT_CERTIFICATES_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyEventCertificatesSwr}. `null`
 * disables the fetch (guest, or the `me` query still in flight). Import this from a
 * call site that needs to `mutate` the entry — never hand-write the tuple.
 */
export const myEventCertificatesKey = (viewerId: string | null) =>
    viewerId ? ([MY_EVENT_CERTIFICATES_SWR_KEY, viewerId] as const) : null

/**
 * SWR query wrapper for {@link getMyEventCertificates}.
 *
 * The key carries the VIEWER ID — a certificate carries the holder's NAME, so a shared
 * cache entry hands B a document made out to A.
 */
export const useGetMyEventCertificatesSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<EventCertificateView[], Error>(
        authenticated ? myEventCertificatesKey(viewerId) : null,
        () => getMyEventCertificates(),
    )

    return swr
}
