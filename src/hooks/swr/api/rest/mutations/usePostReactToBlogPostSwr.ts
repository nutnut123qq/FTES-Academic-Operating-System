import useSWRMutation from "swr/mutation"
import {
    reactToBlogPost,
    type BlogReactionResult,
} from "@/modules/api/rest/blog"

/**
 * SWR mutation wrapper for {@link reactToBlogPost}.
 */
export const usePostReactToBlogPostSwr = () => {
    const swr = useSWRMutation<BlogReactionResult, Error, string, string>(
        "POST_REACT_TO_BLOG_POST_SWR",
        async (_key, { arg }) => {
            return reactToBlogPost(arg)
        },
    )

    return swr
}
