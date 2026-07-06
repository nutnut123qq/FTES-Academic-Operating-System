import useSWRMutation from "swr/mutation"
import { submitGradeJob, type JobRef } from "@/modules/api/rest/ai"

/**
 * SWR mutation wrapper for {@link submitGradeJob}.
 */
export const usePostGradeJobSwr = () => {
    const swr = useSWRMutation<JobRef, Error, string, Record<string, unknown>>(
        "POST_GRADE_JOB_SWR",
        async (_key, { arg }) => {
            return submitGradeJob(arg)
        },
    )

    return swr
}
