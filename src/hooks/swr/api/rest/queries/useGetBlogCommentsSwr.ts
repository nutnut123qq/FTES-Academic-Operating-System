"use client"

import useSWR from "swr"
import {
    getBlogComments,
    type BlogCommentPage,
} from "@/modules/api/rest/blog"

/**
 * SWR query wrapper for {@link getBlogComments}.
 */
export const useGetBlogCommentsSwr = (params: {
    postId: string
    page?: number
    size?: number
}) => {
    const swr = useSWR<BlogCommentPage, Error>(
        [
            "GET_BLOG_COMMENTS_SWR",
            params.postId,
            params.page,
            params.size,
        ],
        () => getBlogComments(params.postId, { page: params.page, size: params.size }),
    )

    return swr
}
