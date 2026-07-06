import useSWRMutation from "swr/mutation"
import {
    updateCollection,
    type CollectionResponse,
    type UpdateCollectionRequest,
} from "@/modules/api/rest/resource"

/**
 * SWR mutation wrapper for {@link updateCollection}.
 */
export const usePostUpdateCollectionSwr = () => {
    const swr = useSWRMutation<
        CollectionResponse,
        Error,
        string,
        { id: string; request: UpdateCollectionRequest }
    >(
        "POST_UPDATE_COLLECTION_SWR",
        async (_key, { arg }) => {
            return updateCollection(arg.id, arg.request)
        },
    )

    return swr
}
