"use client"

import useSWR from "swr"
import { getBookmarks } from "@/modules/api/rest/community"

/**
 * SWR query wrapper for {@link getBookmarks}.
 */
export const useGetCommunityBookmarksSwr = (limit?: number) => {
    const swr = useSWR<Array<string>, Error>(
        ["GET_COMMUNITY_BOOKMARKS_SWR", limit],
        () => getBookmarks(limit),
    )

    return swr
}
