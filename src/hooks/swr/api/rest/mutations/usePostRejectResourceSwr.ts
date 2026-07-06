import useSWRMutation from "swr/mutation"
import {
    rejectResource,
    type RejectRequest,
    type ResourceResponse,
} from "@/modules/api/rest/resource"

/**
 * SWR mutation wrapper for {@link rejectResource}.
 */
export const usePostRejectResourceSwr = () => {
    const swr = useSWRMutation<
        ResourceResponse,
        Error,
        string,
        { id: string; request: RejectRequest }
    >(
        "POST_REJECT_RESOURCE_SWR",
        async (_key, { arg }) => {
            return rejectResource(arg.id, arg.request)
        },
    )

    return swr
}
