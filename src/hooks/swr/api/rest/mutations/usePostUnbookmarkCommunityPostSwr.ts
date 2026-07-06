import useSWRMutation from "swr/mutation"
import { unbookmarkPost } from "@/modules/api/rest/community"

/**
 * SWR mutation wrapper for {@link unbookmarkPost}.
 */
export const usePostUnbookmarkCommunityPostSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_UNBOOKMARK_COMMUNITY_POST_SWR",
        async (_key, { arg }) => {
            return unbookmarkPost(arg)
        },
    )

    return swr
}
