import useSWRMutation from "swr/mutation"
import { removeCollectionItem } from "@/modules/api/rest/resource"

/**
 * SWR mutation wrapper for {@link removeCollectionItem}.
 */
export const usePostRemoveCollectionItemSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { id: string; resourceId: string }
    >(
        "POST_REMOVE_COLLECTION_ITEM_SWR",
        async (_key, { arg }) => {
            return removeCollectionItem(arg.id, arg.resourceId)
        },
    )

    return swr
}
