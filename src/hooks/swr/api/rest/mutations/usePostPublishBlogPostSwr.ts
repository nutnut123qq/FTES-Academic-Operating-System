import useSWRMutation from "swr/mutation"
import {
    publishBlogPost,
    type BlogPostDetail,
    type PublishBlogPostRequest,
} from "@/modules/api/rest/blog"

/**
 * Params for {@link usePostPublishBlogPostSwr}.
 */
export interface PublishBlogPostParams {
    id: string
    request: PublishBlogPostRequest
}

/**
 * SWR mutation wrapper for {@link publishBlogPost}.
 */
export const usePostPublishBlogPostSwr = () => {
    const swr = useSWRMutation<
        BlogPostDetail,
        Error,
        string,
        PublishBlogPostParams
    >("POST_PUBLISH_BLOG_POST_SWR", async (_key, { arg }) => {
        return publishBlogPost(arg.id, arg.request)
    })

    return swr
}
