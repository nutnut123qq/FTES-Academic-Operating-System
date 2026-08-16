"use client"

import useSWR from "swr"
import { getBadgeCatalog, type BadgeCatalogView } from "@/modules/api/rest/gamification"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** Key prefix — module-private on purpose (see {@link badgeCatalogSwrKey}). */
const GET_BADGE_CATALOG_SWR_KEY = "GET_BADGE_CATALOG_SWR"

/**
 * The SWR key this hook subscribes to, for callers that need to `mutate()` it.
 *
 * @param viewerId - the signed-in viewer's id ({@link useViewerScopeId}).
 */
export const badgeCatalogSwrKey = (viewerId: string) => [GET_BADGE_CATALOG_SWR_KEY, viewerId]

/**
 * SWR query wrapper for {@link getBadgeCatalog} (`GET /api/v1/gamification/badges`) —
 * the FULL badge catalog (every badge, earned or not) with how each one is earned
 * plus the viewer's progress.
 *
 * Auth-gated: guests key to `null` so the endpoint never fires (no 401 + retry
 * storm). The key carries the VIEWER ID ({@link useViewerScopeId}) because the
 * `earned` / `progress` / `awardedAt` fields are per-viewer — on the bare key,
 * signing out of A and into B in the same tab would show B account A's progress.
 *
 * @param enabled - pass `false` to hold the request back (e.g. the catalog dialog
 *   is closed, so nothing is paid for until the user actually opens it).
 */
export const useGetBadgeCatalogSwr = (enabled = true) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    return useSWR<BadgeCatalogView, Error>(
        enabled && authenticated && viewerId ? badgeCatalogSwrKey(viewerId) : null,
        () => getBadgeCatalog(),
    )
}
