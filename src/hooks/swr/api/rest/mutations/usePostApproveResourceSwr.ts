import useSWRMutation from "swr/mutation"
import { approveResource, type ResourceResponse } from "@/modules/api/rest/resource"

/**
 * SWR mutation wrapper for {@link approveResource}.
 */
export const usePostApproveResourceSwr = () => {
    const swr = useSWRMutation<ResourceResponse, Error, string, string>(
        "POST_APPROVE_RESOURCE_SWR",
        async (_key, { arg }) => {
            return approveResource(arg)
        },
    )

    return swr
}
