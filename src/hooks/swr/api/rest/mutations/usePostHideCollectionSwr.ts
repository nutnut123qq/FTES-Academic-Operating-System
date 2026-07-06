import useSWRMutation from "swr/mutation"
import { hideCollection } from "@/modules/api/rest/resource"

/**
 * SWR mutation wrapper for {@link hideCollection}.
 */
export const usePostHideCollectionSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_HIDE_COLLECTION_SWR",
        async (_key, { arg }) => {
            return hideCollection(arg)
        },
    )

    return swr
}
