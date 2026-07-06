import useSWRMutation from "swr/mutation"
import { bookmarkPost } from "@/modules/api/rest/community"

/**
 * SWR mutation wrapper for {@link bookmarkPost}.
 */
export const usePostBookmarkCommunityPostSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_BOOKMARK_COMMUNITY_POST_SWR",
        async (_key, { arg }) => {
            return bookmarkPost(arg)
        },
    )

    return swr
}
