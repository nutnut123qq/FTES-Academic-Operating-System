import useSWRMutation from "swr/mutation"
import { deleteBlogComment } from "@/modules/api/rest/blog"

/**
 * SWR mutation wrapper for {@link deleteBlogComment}.
 */
export const usePostDeleteBlogCommentSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_DELETE_BLOG_COMMENT_SWR",
        async (_key, { arg }) => {
            return deleteBlogComment(arg)
        },
    )

    return swr
}
