"use client"

import useSWR from "swr"
import {
    getBlogCategories,
    type BlogCategoryResponse,
} from "@/modules/api/rest/blog"

/**
 * SWR query wrapper for {@link getBlogCategories}.
 */
export const useGetBlogCategoriesSwr = () => {
    const swr = useSWR<BlogCategoryResponse[], Error>(
        ["GET_BLOG_CATEGORIES_SWR"],
        () => getBlogCategories(),
    )

    return swr
}
