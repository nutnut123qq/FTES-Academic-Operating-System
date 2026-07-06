import useSWRMutation from "swr/mutation"
import {
    createCollection,
    type CollectionResponse,
    type CreateCollectionRequest,
} from "@/modules/api/rest/resource"

/**
 * SWR mutation wrapper for {@link createCollection}.
 */
export const usePostCreateCollectionSwr = () => {
    const swr = useSWRMutation<
        CollectionResponse,
        Error,
        string,
        CreateCollectionRequest
    >(
        "POST_CREATE_COLLECTION_SWR",
        async (_key, { arg }) => {
            return createCollection(arg)
        },
    )

    return swr
}
