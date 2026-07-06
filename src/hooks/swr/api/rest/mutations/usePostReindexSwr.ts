import useSWRMutation from "swr/mutation"
import {
    reindex,
    type ReindexJobView,
    type ReindexRequest,
} from "@/modules/api/rest/search"

/**
 * SWR mutation wrapper for {@link reindex}.
 */
export const usePostReindexSwr = () => {
    const swr = useSWRMutation<ReindexJobView, Error, string, ReindexRequest | undefined>(
        "POST_REINDEX_SWR",
        async (_key, { arg }) => {
            return reindex(arg)
        },
    )

    return swr
}
