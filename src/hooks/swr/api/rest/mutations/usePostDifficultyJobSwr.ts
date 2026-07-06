import useSWRMutation from "swr/mutation"
import { submitDifficultyJob, type JobRef } from "@/modules/api/rest/ai"

/**
 * SWR mutation wrapper for {@link submitDifficultyJob}.
 */
export const usePostDifficultyJobSwr = () => {
    const swr = useSWRMutation<JobRef, Error, string, Record<string, unknown>>(
        "POST_DIFFICULTY_JOB_SWR",
        async (_key, { arg }) => {
            return submitDifficultyJob(arg)
        },
    )

    return swr
}
