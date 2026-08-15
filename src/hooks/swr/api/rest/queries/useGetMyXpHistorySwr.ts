"use client"

import useSWR from "swr"
import {
    getMyXpHistory,
    type GamificationPageView,
    type XpEntryView,
} from "@/modules/api/rest/gamification"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's XP ledger. */
export const MY_XP_HISTORY_SWR_KEY = "GET_MY_XP_HISTORY_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyXpHistorySwr}. `null` disables the
 * fetch (guest, or the `me` query still in flight). Import this from a call site that
 * needs to `mutate` the entry — never hand-write the tuple.
 */
export const myXpHistoryKey = (
    viewerId: string | null,
    params?: { page?: number; size?: number },
) =>
    viewerId ? ([MY_XP_HISTORY_SWR_KEY, viewerId, params?.page, params?.size] as const) : null

/**
 * SWR query wrapper for {@link getMyXpHistory}.
 *
 * The key carries the VIEWER ID — paging params do not identify an account, so page 0 of
 * the XP ledger was one entry shared by everyone using the tab.
 */
export const useGetMyXpHistorySwr = (params?: {
    page?: number
    size?: number
}) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<GamificationPageView<XpEntryView>, Error>(
        authenticated ? myXpHistoryKey(viewerId, params) : null,
        () => getMyXpHistory(params),
    )

    return swr
}
