import useSWRMutation from "swr/mutation"
import {
    createBlogComment,
    type BlogCommentResponse,
    type CreateBlogCommentRequest,
} from "@/modules/api/rest/blog"

/**
 * Params for {@link usePostCreateBlogCommentSwr}.
 */
export interface CreateBlogCommentParams {
    postId: string
    request: CreateBlogCommentRequest
}

/**
 * SWR mutation wrapper for {@link createBlogComment}.
 */
export const usePostCreateBlogCommentSwr = () => {
    const swr = useSWRMutation<
        BlogCommentResponse,
        Error,
        string,
        CreateBlogCommentParams
    >("POST_CREATE_BLOG_COMMENT_SWR", async (_key, { arg }) => {
        return createBlogComment(arg.postId, arg.request)
    })

    return swr
}
