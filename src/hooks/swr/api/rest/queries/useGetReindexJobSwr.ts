"use client"

import useSWR from "swr"
import { getReindexJob, type ReindexJobView } from "@/modules/api/rest/search"

/**
 * SWR query wrapper for {@link getReindexJob}.
 */
export const useGetReindexJobSwr = (jobId: string) => {
    const swr = useSWR<ReindexJobView, Error>(
        ["GET_REINDEX_JOB_SWR", jobId],
        () => getReindexJob(jobId),
    )

    return swr
}
