"use client"

import useSWR from "swr"
import { getMyBadges, type BadgeView } from "@/modules/api/rest/gamification"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR query wrapper for {@link getMyBadges} (`GET /api/v1/gamification/me/badges`).
 *
 * Auth-gated: guests key to `null` so the `/me/*` endpoint is never fired (no 401
 * + retry storm) and `data === undefined`. Same gate as the other live
 * gamification hooks; the composed viewer snapshot reads the badge list.
 */
export const useGetMyBadgesSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWR<Array<BadgeView>, Error>(
        authenticated ? ["GET_MY_BADGES_SWR"] : null,
        () => getMyBadges(),
    )

    return swr
}
