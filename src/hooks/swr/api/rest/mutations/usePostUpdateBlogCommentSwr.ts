import useSWRMutation from "swr/mutation"
import {
    updateBlogComment,
    type BlogCommentResponse,
    type UpdateBlogCommentRequest,
} from "@/modules/api/rest/blog"

/**
 * Params for {@link usePostUpdateBlogCommentSwr}.
 */
export interface UpdateBlogCommentParams {
    id: string
    request: UpdateBlogCommentRequest
}

/**
 * SWR mutation wrapper for {@link updateBlogComment}.
 */
export const usePostUpdateBlogCommentSwr = () => {
    const swr = useSWRMutation<
        BlogCommentResponse,
        Error,
        string,
        UpdateBlogCommentParams
    >("POST_UPDATE_BLOG_COMMENT_SWR", async (_key, { arg }) => {
        return updateBlogComment(arg.id, arg.request)
    })

    return swr
}
