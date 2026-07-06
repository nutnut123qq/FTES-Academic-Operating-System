import useSWRMutation from "swr/mutation"
import {
    updatePost,
    type PostResponse,
    type UpdatePostRequest,
} from "@/modules/api/rest/community"

/**
 * SWR mutation wrapper for {@link updatePost}.
 */
export const usePostUpdateCommunityPostSwr = () => {
    const swr = useSWRMutation<
        PostResponse,
        Error,
        string,
        { id: string; request: UpdatePostRequest }
    >(
        "POST_UPDATE_COMMUNITY_POST_SWR",
        async (_key, { arg }) => {
            return updatePost(arg.id, arg.request)
        },
    )

    return swr
}
