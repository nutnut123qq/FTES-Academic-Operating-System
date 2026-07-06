import useSWRMutation from "swr/mutation"
import { archiveSession } from "@/modules/api/rest/ai"

/**
 * SWR mutation wrapper for {@link archiveSession}.
 */
export const usePostArchiveAiSessionSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_ARCHIVE_AI_SESSION_SWR",
        async (_key, { arg }) => {
            return archiveSession(arg)
        },
    )

    return swr
}
