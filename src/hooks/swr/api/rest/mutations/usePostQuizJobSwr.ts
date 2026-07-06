import useSWRMutation from "swr/mutation"
import { submitQuizJob, type JobRef } from "@/modules/api/rest/ai"

/**
 * SWR mutation wrapper for {@link submitQuizJob}.
 */
export const usePostQuizJobSwr = () => {
    const swr = useSWRMutation<JobRef, Error, string, Record<string, unknown>>(
        "POST_QUIZ_JOB_SWR",
        async (_key, { arg }) => {
            return submitQuizJob(arg)
        },
    )

    return swr
}
