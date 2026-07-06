import useSWRMutation from "swr/mutation"
import { archiveResource, type ResourceResponse } from "@/modules/api/rest/resource"

/**
 * SWR mutation wrapper for {@link archiveResource}.
 */
export const usePostArchiveResourceSwr = () => {
    const swr = useSWRMutation<ResourceResponse, Error, string, string>(
        "POST_ARCHIVE_RESOURCE_SWR",
        async (_key, { arg }) => {
            return archiveResource(arg)
        },
    )

    return swr
}
