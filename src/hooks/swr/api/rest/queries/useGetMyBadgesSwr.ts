"use client"

import useSWR from "swr"
import { getMyBadges, type BadgeView } from "@/modules/api/rest/gamification"

/**
 * SWR query wrapper for {@link getMyBadges}.
 */
export const useGetMyBadgesSwr = () => {
    const swr = useSWR<Array<BadgeView>, Error>(["GET_MY_BADGES_SWR"], () =>
        getMyBadges(),
    )

    return swr
}
