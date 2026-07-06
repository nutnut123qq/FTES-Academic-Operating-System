import useSWRMutation from "swr/mutation"
import { submitOcrJob, type JobRef } from "@/modules/api/rest/ai"

/**
 * SWR mutation wrapper for {@link submitOcrJob}.
 */
export const usePostOcrJobSwr = () => {
    const swr = useSWRMutation<JobRef, Error, string, Record<string, unknown>>(
        "POST_OCR_JOB_SWR",
        async (_key, { arg }) => {
            return submitOcrJob(arg)
        },
    )

    return swr
}
