"use client"

import useSWR from "swr"
import {
    getProfileTimeline,
    type CursorPage,
    type TimelineEntry,
} from "@/modules/api/rest/profile"

/**
 * SWR query wrapper for {@link getProfileTimeline}.
 */
export const useGetProfileTimelineSwr = (
    username: string,
    params?: {
        cursor?: string | null
        limit?: number
    },
) => {
    const swr = useSWR<CursorPage<TimelineEntry>, Error>(
        ["GET_PROFILE_TIMELINE_SWR", username, params?.cursor, params?.limit],
        () => getProfileTimeline(username, params),
    )

    return swr
}
