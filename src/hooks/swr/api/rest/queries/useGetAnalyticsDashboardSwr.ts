"use client"

import useSWR from "swr"
import {
    getAnalyticsDashboard,
    type AnalyticsDashboard,
} from "@/modules/api/rest/analytics"

/**
 * SWR query wrapper for {@link getAnalyticsDashboard}.
 */
export const useGetAnalyticsDashboardSwr = (
    domain: string,
    params?: {
        from?: string
        to?: string
        granularity?: string
        userId?: string
        subjectId?: string
    },
) => {
    const swr = useSWR<AnalyticsDashboard, Error>(
        ["GET_ANALYTICS_DASHBOARD_SWR", domain, params],
        () => getAnalyticsDashboard(domain, params),
    )

    return swr
}
