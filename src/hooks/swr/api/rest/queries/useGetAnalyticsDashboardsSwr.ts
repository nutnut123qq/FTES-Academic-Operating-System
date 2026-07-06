"use client"

import useSWR from "swr"
import { listAnalyticsDashboards } from "@/modules/api/rest/analytics"

/**
 * SWR query wrapper for {@link listAnalyticsDashboards}.
 */
export const useGetAnalyticsDashboardsSwr = () => {
    const swr = useSWR<string[], Error>(
        ["GET_ANALYTICS_DASHBOARDS_SWR"],
        () => listAnalyticsDashboards(),
    )

    return swr
}
