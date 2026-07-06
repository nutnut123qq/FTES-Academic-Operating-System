import useSWRMutation from "swr/mutation"
import { submitResource, type ResourceResponse } from "@/modules/api/rest/resource"

/**
 * SWR mutation wrapper for {@link submitResource}.
 */
export const usePostSubmitResourceSwr = () => {
    const swr = useSWRMutation<ResourceResponse, Error, string, string>(
        "POST_SUBMIT_RESOURCE_SWR",
        async (_key, { arg }) => {
            return submitResource(arg)
        },
    )

    return swr
}
