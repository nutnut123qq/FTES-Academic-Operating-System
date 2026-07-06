import useSWRMutation from "swr/mutation"
import {
    addCollectionItem,
    type AddItemRequest,
    type CollectionItemResponse,
} from "@/modules/api/rest/resource"

/**
 * SWR mutation wrapper for {@link addCollectionItem}.
 */
export const usePostAddCollectionItemSwr = () => {
    const swr = useSWRMutation<
        CollectionItemResponse,
        Error,
        string,
        { id: string; request: AddItemRequest }
    >(
        "POST_ADD_COLLECTION_ITEM_SWR",
        async (_key, { arg }) => {
            return addCollectionItem(arg.id, arg.request)
        },
    )

    return swr
}
