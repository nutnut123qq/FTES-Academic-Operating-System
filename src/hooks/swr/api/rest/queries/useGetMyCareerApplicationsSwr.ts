"use client"

import useSWR from "swr"
import {
    getMyCareerApplications,
    type CareerOpportunityApplication,
} from "@/modules/api/rest/career"

/**
 * SWR query wrapper for {@link getMyCareerApplications}.
 */
export const useGetMyCareerApplicationsSwr = () => {
    const swr = useSWR<CareerOpportunityApplication[], Error>(
        ["GET_MY_CAREER_APPLICATIONS_SWR"],
        () => getMyCareerApplications(),
    )

    return swr
}
