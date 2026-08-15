"use client"

import useSWR from "swr"
import {
    getMyLoginHistory,
    type SecurityLoginHistoryRequest,
    type SecurityLoginHistoryView,
    type SecurityPageResponse,
} from "@/modules/api/rest/identity-security"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's sign-in audit log. */
export const MY_LOGIN_HISTORY_SWR_KEY = "GET_MY_LOGIN_HISTORY_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyLoginHistorySwr}. `null` disables
 * the fetch (guest, or the `me` query still in flight). Import this from a call site
 * that needs to `mutate` the entry — never hand-write the tuple.
 */
export const myLoginHistoryKey = (
    viewerId: string | null,
    request?: SecurityLoginHistoryRequest,
) => (viewerId ? ([MY_LOGIN_HISTORY_SWR_KEY, viewerId, request] as const) : null)

/**
 * SWR query wrapper for {@link getMyLoginHistory}.
 *
 * The key carries the VIEWER ID. The rows are an audit log — IP addresses, devices,
 * locations, timestamps — so a shared cache entry showed B exactly where and on what A
 * had been signing in. That is the single worst thing in this family to serve across
 * accounts, and the security settings page renders it verbatim.
 */
export const useGetMyLoginHistorySwr = (request?: SecurityLoginHistoryRequest) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<
        SecurityPageResponse<SecurityLoginHistoryView>,
        Error
    >(authenticated ? myLoginHistoryKey(viewerId, request) : null, () =>
        getMyLoginHistory(request),
    )

    return swr
}
