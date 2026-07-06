import useSWRMutation from "swr/mutation"
import {
    createResource,
    type CreateResourceRequest,
    type ResourceResponse,
} from "@/modules/api/rest/resource"

/**
 * SWR mutation wrapper for {@link createResource}.
 */
export const usePostCreateResourceSwr = () => {
    const swr = useSWRMutation<
        ResourceResponse,
        Error,
        string,
        CreateResourceRequest
    >(
        "POST_CREATE_RESOURCE_SWR",
        async (_key, { arg }) => {
            return createResource(arg)
        },
    )

    return swr
}
