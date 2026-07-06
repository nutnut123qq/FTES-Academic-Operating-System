import useSWRMutation from "swr/mutation"
import {
    sharePost,
    type PostResponse,
    type ShareRequest,
} from "@/modules/api/rest/community"

/**
 * SWR mutation wrapper for {@link sharePost}.
 */
export const usePostShareCommunityPostSwr = () => {
    const swr = useSWRMutation<
        PostResponse,
        Error,
        string,
        { id: string; request: ShareRequest }
    >(
        "POST_SHARE_COMMUNITY_POST_SWR",
        async (_key, { arg }) => {
            return sharePost(arg.id, arg.request)
        },
    )

    return swr
}
