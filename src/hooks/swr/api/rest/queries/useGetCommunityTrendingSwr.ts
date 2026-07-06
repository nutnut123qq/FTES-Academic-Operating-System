"use client"

import useSWR from "swr"
import { getTrending, type PostResponse } from "@/modules/api/rest/community"

/**
 * SWR query wrapper for {@link getTrending}.
 */
export const useGetCommunityTrendingSwr = (params?: {
    scope?: string
    limit?: number
}) => {
    const swr = useSWR<Array<PostResponse>, Error>(
        ["GET_COMMUNITY_TRENDING_SWR", params?.scope, params?.limit],
        () => getTrending(params),
    )

    return swr
}
