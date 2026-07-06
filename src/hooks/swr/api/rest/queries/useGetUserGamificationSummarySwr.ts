"use client"

import useSWR from "swr"
import {
    getUserGamificationSummary,
    type SummaryView,
} from "@/modules/api/rest/gamification"

/**
 * SWR query wrapper for {@link getUserGamificationSummary}.
 */
export const useGetUserGamificationSummarySwr = (userId: string) => {
    const swr = useSWR<SummaryView, Error>(
        ["GET_USER_GAMIFICATION_SUMMARY_SWR", userId],
        () => getUserGamificationSummary(userId),
    )

    return swr
}
