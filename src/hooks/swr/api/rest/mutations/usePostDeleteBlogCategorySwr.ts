import useSWRMutation from "swr/mutation"
import { deleteBlogCategory } from "@/modules/api/rest/blog"

/**
 * SWR mutation wrapper for {@link deleteBlogCategory}.
 */
export const usePostDeleteBlogCategorySwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_DELETE_BLOG_CATEGORY_SWR",
        async (_key, { arg }) => {
            return deleteBlogCategory(arg)
        },
    )

    return swr
}
