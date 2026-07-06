import useSWRMutation from "swr/mutation"
import { deletePost } from "@/modules/api/rest/community"

/**
 * SWR mutation wrapper for {@link deletePost}.
 */
export const usePostDeleteCommunityPostSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_DELETE_COMMUNITY_POST_SWR",
        async (_key, { arg }) => {
            return deletePost(arg)
        },
    )

    return swr
}
