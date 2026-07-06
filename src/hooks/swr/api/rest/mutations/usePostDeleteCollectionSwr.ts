import useSWRMutation from "swr/mutation"
import { deleteCollection } from "@/modules/api/rest/resource"

/**
 * SWR mutation wrapper for {@link deleteCollection}.
 */
export const usePostDeleteCollectionSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_DELETE_COLLECTION_SWR",
        async (_key, { arg }) => {
            return deleteCollection(arg)
        },
    )

    return swr
}
