import useSWRMutation from "swr/mutation"
import { submitSummaryJob, type JobRef } from "@/modules/api/rest/ai"

/**
 * SWR mutation wrapper for {@link submitSummaryJob}.
 */
export const usePostSummaryJobSwr = () => {
    const swr = useSWRMutation<JobRef, Error, string, Record<string, unknown>>(
        "POST_SUMMARY_JOB_SWR",
        async (_key, { arg }) => {
            return submitSummaryJob(arg)
        },
    )

    return swr
}
