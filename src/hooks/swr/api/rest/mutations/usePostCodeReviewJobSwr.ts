import useSWRMutation from "swr/mutation"
import { submitCodeReviewJob, type JobRef } from "@/modules/api/rest/ai"

/**
 * SWR mutation wrapper for {@link submitCodeReviewJob}.
 */
export const usePostCodeReviewJobSwr = () => {
    const swr = useSWRMutation<JobRef, Error, string, Record<string, unknown>>(
        "POST_CODE_REVIEW_JOB_SWR",
        async (_key, { arg }) => {
            return submitCodeReviewJob(arg)
        },
    )

    return swr
}
