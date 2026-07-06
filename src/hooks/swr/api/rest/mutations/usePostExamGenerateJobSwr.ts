import useSWRMutation from "swr/mutation"
import { submitExamGenerateJob, type JobRef } from "@/modules/api/rest/ai"

/**
 * SWR mutation wrapper for {@link submitExamGenerateJob}.
 */
export const usePostExamGenerateJobSwr = () => {
    const swr = useSWRMutation<JobRef, Error, string, Record<string, unknown>>(
        "POST_EXAM_GENERATE_JOB_SWR",
        async (_key, { arg }) => {
            return submitExamGenerateJob(arg)
        },
    )

    return swr
}
