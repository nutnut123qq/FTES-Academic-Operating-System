import useSWRMutation from "swr/mutation"
import {
    updateResource,
    type ResourceResponse,
    type UpdateResourceRequest,
} from "@/modules/api/rest/resource"

/**
 * SWR mutation wrapper for {@link updateResource}.
 */
export const usePostUpdateResourceSwr = () => {
    const swr = useSWRMutation<
        ResourceResponse,
        Error,
        string,
        { id: string; request: UpdateResourceRequest }
    >(
        "POST_UPDATE_RESOURCE_SWR",
        async (_key, { arg }) => {
            return updateResource(arg.id, arg.request)
        },
    )

    return swr
}
