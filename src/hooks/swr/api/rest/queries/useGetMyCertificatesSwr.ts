"use client"

import useSWR from "swr"
import {
    getMyCertificates,
    type CertificateView,
} from "@/modules/api/rest/course"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's earned course certificates. */
export const MY_CERTIFICATES_SWR_KEY = "GET_MY_CERTIFICATES_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyCertificatesSwr}. `null` disables
 * the fetch (guest, or the `me` query still in flight). Import this from a call site
 * that needs to `mutate` the entry — never hand-write the tuple.
 */
export const myCertificatesKey = (viewerId: string | null) =>
    viewerId ? ([MY_CERTIFICATES_SWR_KEY, viewerId] as const) : null

/**
 * SWR query wrapper for {@link getMyCertificates}.
 *
 * `GET /courses/me/certificates` is a signed-in-only endpoint, so pass
 * `enabled: false` (e.g. for guests) to skip the request entirely.
 *
 * The key also carries the VIEWER ID. `enabled` only answers "should we ask at all" —
 * it is not an identity, so on the old bare key A's certificates (name, course, serial)
 * were served to B after a same-tab account switch. Requiring a resolved viewer id also
 * means a signed-in-but-not-yet-hydrated session waits rather than caching an answer it
 * cannot attribute.
 */
export const useGetMyCertificatesSwr = (enabled = true) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<Array<CertificateView>, Error>(
        enabled && authenticated ? myCertificatesKey(viewerId) : null,
        () => getMyCertificates(),
    )

    return swr
}
