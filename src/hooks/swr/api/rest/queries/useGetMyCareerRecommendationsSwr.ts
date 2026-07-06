"use client"

import useSWR from "swr"
import {
    getMyCareerRecommendations,
    type CareerRecommendation,
} from "@/modules/api/rest/career"

/**
 * SWR query wrapper for {@link getMyCareerRecommendations}.
 */
export const useGetMyCareerRecommendationsSwr = (params?: { kind?: string }) => {
    const swr = useSWR<CareerRecommendation[], Error>(
        ["GET_MY_CAREER_RECOMMENDATIONS_SWR", params?.kind],
        () => getMyCareerRecommendations(params),
    )

    return swr
}
