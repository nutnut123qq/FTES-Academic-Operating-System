import useSWRMutation from "swr/mutation"
import { submitCvReviewJob, type JobRef } from "@/modules/api/rest/ai"

/**
 * SWR mutation wrapper for {@link submitCvReviewJob}.
 */
export const usePostCvReviewJobSwr = () => {
    const swr = useSWRMutation<JobRef, Error, string, Record<string, unknown>>(
        "POST_CV_REVIEW_JOB_SWR",
        async (_key, { arg }) => {
            return submitCvReviewJob(arg)
        },
    )

    return swr
}
