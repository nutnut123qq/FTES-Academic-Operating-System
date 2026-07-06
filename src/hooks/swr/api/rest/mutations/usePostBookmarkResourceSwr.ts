import useSWRMutation from "swr/mutation"
import { bookmarkResource, type ToggleResponse } from "@/modules/api/rest/resource"

/**
 * SWR mutation wrapper for {@link bookmarkResource}.
 */
export const usePostBookmarkResourceSwr = () => {
    const swr = useSWRMutation<ToggleResponse, Error, string, string>(
        "POST_BOOKMARK_RESOURCE_SWR",
        async (_key, { arg }) => {
            return bookmarkResource(arg)
        },
    )

    return swr
}
