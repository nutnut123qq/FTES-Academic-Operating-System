import useSWRMutation from "swr/mutation"
import { deleteBlogPost } from "@/modules/api/rest/blog"

/**
 * SWR mutation wrapper for {@link deleteBlogPost}.
 */
export const usePostDeleteBlogPostSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_DELETE_BLOG_POST_SWR",
        async (_key, { arg }) => {
            return deleteBlogPost(arg)
        },
    )

    return swr
}
