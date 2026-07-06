import useSWRMutation from "swr/mutation"
import {
    reorderCollectionItems,
    type ResourceReorderRequest,
} from "@/modules/api/rest/resource"

/**
 * SWR mutation wrapper for {@link reorderCollectionItems}.
 */
export const usePostReorderCollectionItemsSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { id: string; request: ResourceReorderRequest }
    >(
        "POST_REORDER_COLLECTION_ITEMS_SWR",
        async (_key, { arg }) => {
            return reorderCollectionItems(arg.id, arg.request)
        },
    )

    return swr
}
