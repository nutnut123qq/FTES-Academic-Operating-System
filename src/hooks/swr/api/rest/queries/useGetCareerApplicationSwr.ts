"use client"

import useSWR from "swr"
import {
    getCareerApplication,
    type CareerOpportunityApplication,
} from "@/modules/api/rest/career"

/**
 * SWR query wrapper for {@link getCareerApplication}.
 */
export const useGetCareerApplicationSwr = (id: string) => {
    const swr = useSWR<CareerOpportunityApplication, Error>(
        ["GET_CAREER_APPLICATION_SWR", id],
        () => getCareerApplication(id),
    )

    return swr
}
