"use client"

import useSWR from "swr"
import { getMyBookmarks } from "@/modules/api/rest/resource"

/**
 * SWR query wrapper for {@link getMyBookmarks}.
 */
export const useGetMyBookmarksSwr = (params?: {
    page?: number
    size?: number
}) => {
    const swr = useSWR<Array<string>, Error>(
        ["GET_MY_BOOKMARKS_SWR", params?.page, params?.size],
        () => getMyBookmarks(params),
    )

    return swr
}
