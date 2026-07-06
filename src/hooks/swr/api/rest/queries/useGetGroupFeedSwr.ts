"use client"

import useSWR from "swr"
import { getGroupFeed, type GroupFeedSlice } from "@/modules/api/rest/group"

/**
 * SWR query wrapper for {@link getGroupFeed}.
 */
export const useGetGroupFeedSwr = (
    id: string,
    request?: {
        cursor?: string
        limit?: number
    },
) => {
    const swr = useSWR<GroupFeedSlice, Error>(
        ["GET_GROUP_FEED_SWR", id, request],
        () => getGroupFeed(id, request),
    )

    return swr
}
