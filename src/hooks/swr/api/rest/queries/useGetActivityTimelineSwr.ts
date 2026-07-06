"use client"

import useSWR from "swr"
import {
    getActivityTimeline,
    type ActivityCursorPage,
    type ActivityView,
} from "@/modules/api/rest/activity"

/**
 * SWR query wrapper for {@link getActivityTimeline}.
 */
export const useGetActivityTimelineSwr = (request?: {
    userId?: string
    contextType?: string
    contextId?: string
    types?: string
    cursor?: string
    limit?: number
}) => {
    const swr = useSWR<ActivityCursorPage<ActivityView>, Error>(
        ["GET_ACTIVITY_TIMELINE_SWR", request],
        () => getActivityTimeline(request),
    )

    return swr
}
