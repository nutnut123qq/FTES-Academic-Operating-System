"use client"

import useSWR from "swr"
import {
    getRecommendations,
    type RecommendationItem,
} from "@/modules/api/rest/recommendation"

/**
 * SWR query wrapper for {@link getRecommendations}.
 */
export const useGetRecommendationsSwr = (request: {
    type: string
    limit?: number
}) => {
    const swr = useSWR<RecommendationItem[], Error>(
        ["GET_RECOMMENDATIONS_SWR", request],
        () => getRecommendations(request),
    )

    return swr
}
