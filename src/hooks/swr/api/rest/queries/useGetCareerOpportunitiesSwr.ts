"use client"

import useSWR from "swr"
import {
    getCareerOpportunities,
    type CareerOpportunity,
} from "@/modules/api/rest/career"

/**
 * SWR query wrapper for {@link getCareerOpportunities}.
 */
export const useGetCareerOpportunitiesSwr = (params?: {
    type?: string
    track?: string
    status?: string
}) => {
    const swr = useSWR<CareerOpportunity[], Error>(
        [
            "GET_CAREER_OPPORTUNITIES_SWR",
            params?.type,
            params?.track,
            params?.status,
        ],
        () => getCareerOpportunities(params),
    )

    return swr
}
