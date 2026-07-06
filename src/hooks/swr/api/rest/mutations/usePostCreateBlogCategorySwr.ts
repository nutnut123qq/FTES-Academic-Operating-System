import useSWRMutation from "swr/mutation"
import {
    createBlogCategory,
    type BlogCategoryRequest,
    type BlogCategoryResponse,
} from "@/modules/api/rest/blog"

/**
 * SWR mutation wrapper for {@link createBlogCategory}.
 */
export const usePostCreateBlogCategorySwr = () => {
    const swr = useSWRMutation<
        BlogCategoryResponse,
        Error,
        string,
        BlogCategoryRequest
    >("POST_CREATE_BLOG_CATEGORY_SWR", async (_key, { arg }) => {
        return createBlogCategory(arg)
    })

    return swr
}
