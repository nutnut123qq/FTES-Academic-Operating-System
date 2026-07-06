import useSWRMutation from "swr/mutation"
import {
    updateBlogCategory,
    type BlogCategoryRequest,
    type BlogCategoryResponse,
} from "@/modules/api/rest/blog"

/**
 * Params for {@link usePostUpdateBlogCategorySwr}.
 */
export interface UpdateBlogCategoryParams {
    id: string
    request: BlogCategoryRequest
}

/**
 * SWR mutation wrapper for {@link updateBlogCategory}.
 */
export const usePostUpdateBlogCategorySwr = () => {
    const swr = useSWRMutation<
        BlogCategoryResponse,
        Error,
        string,
        UpdateBlogCategoryParams
    >("POST_UPDATE_BLOG_CATEGORY_SWR", async (_key, { arg }) => {
        return updateBlogCategory(arg.id, arg.request)
    })

    return swr
}
