"use client"

import useSWR from "swr"
import {
    getMyXpHistory,
    type GamificationPageView,
    type XpEntryView,
} from "@/modules/api/rest/gamification"

/**
 * SWR query wrapper for {@link getMyXpHistory}.
 */
export const useGetMyXpHistorySwr = (params?: {
    page?: number
    size?: number
}) => {
    const swr = useSWR<GamificationPageView<XpEntryView>, Error>(
        ["GET_MY_XP_HISTORY_SWR", params?.page, params?.size],
        () => getMyXpHistory(params),
    )

    return swr
}
