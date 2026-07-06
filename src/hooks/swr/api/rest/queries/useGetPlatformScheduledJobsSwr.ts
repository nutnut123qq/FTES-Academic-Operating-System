"use client"

import useSWR from "swr"
import {
    listPlatformScheduledJobs,
    type PlatformScheduledJob,
} from "@/modules/api/rest/platform"

/**
 * SWR query wrapper for {@link listPlatformScheduledJobs}.
 */
export const useGetPlatformScheduledJobsSwr = () => {
    const swr = useSWR<PlatformScheduledJob[], Error>(
        "GET_PLATFORM_SCHEDULED_JOBS_SWR",
        () => listPlatformScheduledJobs(),
    )

    return swr
}
