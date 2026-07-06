"use client"

import useSWR from "swr"
import { getPost, type PostResponse } from "@/modules/api/rest/community"

/**
 * SWR query wrapper for {@link getPost}.
 */
export const useGetCommunityPostSwr = (id: string) => {
    const swr = useSWR<PostResponse, Error>(
        ["GET_COMMUNITY_POST_SWR", id],
        () => getPost(id),
    )

    return swr
}
