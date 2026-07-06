import useSWRMutation from "swr/mutation"
import { submitFlashcardsJob, type JobRef } from "@/modules/api/rest/ai"

/**
 * SWR mutation wrapper for {@link submitFlashcardsJob}.
 */
export const usePostFlashcardsJobSwr = () => {
    const swr = useSWRMutation<JobRef, Error, string, Record<string, unknown>>(
        "POST_FLASHCARDS_JOB_SWR",
        async (_key, { arg }) => {
            return submitFlashcardsJob(arg)
        },
    )

    return swr
}
