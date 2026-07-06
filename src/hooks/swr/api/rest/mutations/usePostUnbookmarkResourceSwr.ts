import useSWRMutation from "swr/mutation"
import {
    unbookmarkResource,
    type ToggleResponse,
} from "@/modules/api/rest/resource"

/**
 * SWR mutation wrapper for {@link unbookmarkResource}.
 */
export const usePostUnbookmarkResourceSwr = () => {
    const swr = useSWRMutation<ToggleResponse, Error, string, string>(
        "POST_UNBOOKMARK_RESOURCE_SWR",
        async (_key, { arg }) => {
            return unbookmarkResource(arg)
        },
    )

    return swr
}
