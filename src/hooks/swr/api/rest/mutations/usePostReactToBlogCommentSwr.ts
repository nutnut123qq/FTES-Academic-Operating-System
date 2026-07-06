import useSWRMutation from "swr/mutation"
import {
    reactToBlogComment,
    type BlogReactionResult,
} from "@/modules/api/rest/blog"

/**
 * SWR mutation wrapper for {@link reactToBlogComment}.
 */
export const usePostReactToBlogCommentSwr = () => {
    const swr = useSWRMutation<BlogReactionResult, Error, string, string>(
        "POST_REACT_TO_BLOG_COMMENT_SWR",
        async (_key, { arg }) => {
            return reactToBlogComment(arg)
        },
    )

    return swr
}
