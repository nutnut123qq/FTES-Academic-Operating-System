"use client"

import useSWR from "swr"
import {
    getPersonalizeSignals,
    type RecommendationSignalPage,
} from "@/modules/api/rest/recommendation"

/**
 * SWR query wrapper for {@link getPersonalizeSignals}.
 */
export const useGetPersonalizeSignalsSwr = (
    userId: string,
    request?: {
        windowType?: string
        signalKey?: string
        cursor?: string
        limit?: number
    },
) => {
    const swr = useSWR<RecommendationSignalPage, Error>(
        ["GET_PERSONALIZE_SIGNALS_SWR", userId, request],
        () => getPersonalizeSignals(userId, request),
    )

    return swr
}
