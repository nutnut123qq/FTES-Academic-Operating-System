"use client"

import useSWR from "swr"
import {
    listPinnedPosts,
    type GroupPostSummary,
} from "@/modules/api/rest/group"

/**
 * SWR query wrapper for {@link listPinnedPosts}.
 */
export const useGetGroupPinnedPostsSwr = (id: string) => {
    const swr = useSWR<GroupPostSummary[], Error>(
        ["GET_GROUP_PINNED_POSTS_SWR", id],
        () => listPinnedPosts(id),
    )

    return swr
}
