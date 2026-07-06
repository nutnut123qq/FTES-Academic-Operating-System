"use client"

import useSWR from "swr"
import { getJob, type JobView } from "@/modules/api/rest/ai"

/**
 * SWR query wrapper for {@link getJob}.
 */
export const useGetAiJobSwr = (id: string) => {
    const swr = useSWR<JobView, Error>(["GET_AI_JOB_SWR", id], () => getJob(id))

    return swr
}
