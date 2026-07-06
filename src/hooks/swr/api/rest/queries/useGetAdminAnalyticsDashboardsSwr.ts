"use client"

import useSWR from "swr"
import { getAdminAnalyticsDashboards } from "@/modules/api/rest/admin"

/**
 * SWR query wrapper for {@link getAdminAnalyticsDashboards}.
 */
export const useGetAdminAnalyticsDashboardsSwr = () => {
    const swr = useSWR<string[], Error>(
        "GET_ADMIN_ANALYTICS_DASHBOARDS_SWR",
        () => getAdminAnalyticsDashboards(),
    )

    return swr
}
