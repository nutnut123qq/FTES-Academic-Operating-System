"use client"

import useSWR from "swr"
import { listPlatformJobRuns } from "@/modules/api/rest/platform"

/**
 * SWR query wrapper for {@link listPlatformJobRuns}.
 */
export const useGetPlatformJobRunsSwr = (
    jobKey: string,
    page?: number,
) => {
    const swr = useSWR<Record<string, unknown>[], Error>(
        ["GET_PLATFORM_JOB_RUNS_SWR", jobKey, page],
        () => listPlatformJobRuns(jobKey, page),
    )

    return swr
}
