import useSWRMutation from "swr/mutation"
import {
    createBlogPost,
    type BlogPostDetail,
    type CreateBlogPostRequest,
} from "@/modules/api/rest/blog"

/**
 * SWR mutation wrapper for {@link createBlogPost}.
 */
export const usePostCreateBlogPostSwr = () => {
    const swr = useSWRMutation<
        BlogPostDetail,
        Error,
        string,
        CreateBlogPostRequest
    >("POST_CREATE_BLOG_POST_SWR", async (_key, { arg }) => {
        return createBlogPost(arg)
    })

    return swr
}
