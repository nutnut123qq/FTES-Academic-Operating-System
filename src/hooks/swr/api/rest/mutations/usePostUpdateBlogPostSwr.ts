import useSWRMutation from "swr/mutation"
import {
    updateBlogPost,
    type BlogPostDetail,
    type UpdateBlogPostRequest,
} from "@/modules/api/rest/blog"

/**
 * Params for {@link usePostUpdateBlogPostSwr}.
 */
export interface UpdateBlogPostParams {
    id: string
    request: UpdateBlogPostRequest
}

/**
 * SWR mutation wrapper for {@link updateBlogPost}.
 */
export const usePostUpdateBlogPostSwr = () => {
    const swr = useSWRMutation<
        BlogPostDetail,
        Error,
        string,
        UpdateBlogPostParams
    >("POST_UPDATE_BLOG_POST_SWR", async (_key, { arg }) => {
        return updateBlogPost(arg.id, arg.request)
    })

    return swr
}
