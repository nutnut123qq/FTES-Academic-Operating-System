"use client"

import useSWR from "swr"
import {
    getAnalyticsExportStatus,
    type AnalyticsExportStatus,
} from "@/modules/api/rest/analytics"

/**
 * SWR query wrapper for {@link getAnalyticsExportStatus}.
 */
export const useGetAnalyticsExportStatusSwr = (jobId: string) => {
    const swr = useSWR<AnalyticsExportStatus, Error>(
        ["GET_ANALYTICS_EXPORT_STATUS_SWR", jobId],
        () => getAnalyticsExportStatus(jobId),
    )

    return swr
}
