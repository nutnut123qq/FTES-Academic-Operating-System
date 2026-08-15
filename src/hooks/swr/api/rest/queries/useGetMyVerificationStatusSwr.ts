"use client"

import useSWR from "swr"
import {
    getMyVerificationStatus,
    type SecurityVerificationStatusView,
} from "@/modules/api/rest/identity-security"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's email/phone verification flags. */
export const MY_VERIFICATION_STATUS_SWR_KEY = "GET_MY_VERIFICATION_STATUS_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyVerificationStatusSwr}. `null`
 * disables the fetch (guest, or the `me` query still in flight).
 *
 * `ChangeEmailSection` revalidates this entry after a successful email change and MUST
 * import this builder rather than re-typing the key: the key is now a tuple, so the old
 * hand-written `mutate("GET_MY_VERIFICATION_STATUS_SWR")` would match nothing and the
 * "unverified" chip would silently keep showing the pre-change state.
 */
export const myVerificationStatusKey = (viewerId: string | null) =>
    viewerId ? ([MY_VERIFICATION_STATUS_SWR_KEY, viewerId] as const) : null

/**
 * SWR query wrapper for {@link getMyVerificationStatus}.
 *
 * The key carries the VIEWER ID — on the shared key B could be told their email is
 * already verified because A's was, hiding the verification prompt B actually needs.
 */
export const useGetMyVerificationStatusSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<SecurityVerificationStatusView, Error>(
        authenticated ? myVerificationStatusKey(viewerId) : null,
        () => getMyVerificationStatus(),
    )

    return swr
}
