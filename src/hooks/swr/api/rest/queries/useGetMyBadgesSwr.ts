"use client"

import useSWR from "swr"
import { getMyBadges, type BadgeView } from "@/modules/api/rest/gamification"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** Key prefix — module-private on purpose (see {@link myBadgesSwrKey}). */
const GET_MY_BADGES_SWR_KEY = "GET_MY_BADGES_SWR"

/**
 * The SWR key this hook subscribes to, for callers that need to `mutate()` it.
 *
 * Exported as a BUILDER rather than a bare prefix so a call site cannot rebuild the
 * array by hand and silently drift from the hook: the viewer id is part of the key,
 * and a hand-written `["GET_MY_BADGES_SWR"]` would match nothing.
 *
 * @param viewerId - the signed-in viewer's id ({@link useViewerScopeId}).
 */
export const myBadgesSwrKey = (viewerId: string) => [GET_MY_BADGES_SWR_KEY, viewerId]

/**
 * SWR query wrapper for {@link getMyBadges} (`GET /api/v1/gamification/me/badges`).
 *
 * Auth-gated: guests key to `null` so the `/me/*` endpoint is never fired (no 401
 * + retry storm) and `data === undefined`. Same gate as the other live
 * gamification hooks; the composed viewer snapshot reads the badge list.
 *
 * The key also carries the VIEWER ID ({@link useViewerScopeId}). "Somebody is signed
 * in" is not an identity: on the bare key, signing out of A and into B in the same tab
 * re-keys to the same cache entry and B is shown A's badges.
 */
export const useGetMyBadgesSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<Array<BadgeView>, Error>(
        authenticated && viewerId ? myBadgesSwrKey(viewerId) : null,
        () => getMyBadges(),
    )

    return swr
}
