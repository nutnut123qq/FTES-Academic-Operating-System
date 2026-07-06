"use client"

import useSWR from "swr"
import {
    getAdminAnalyticsDashboard,
    type AdminAnalyticsDashboardRequest,
} from "@/modules/api/rest/admin"

/**
 * SWR query wrapper for {@link getAdminAnalyticsDashboard}.
 */
export const useGetAdminAnalyticsDashboardSwr = (
    key: string,
    request?: AdminAnalyticsDashboardRequest,
) => {
    const swr = useSWR<Record<string, unknown>, Error>(
        ["GET_ADMIN_ANALYTICS_DASHBOARD_SWR", key, request],
        () => getAdminAnalyticsDashboard(key, request),
    )

    return swr
}
