"use client"

import useSWR from "swr"
import { getActivity, type ActivityView } from "@/modules/api/rest/activity"

/**
 * SWR query wrapper for {@link getActivity}.
 */
export const useGetActivitySwr = (eventId: string) => {
    const swr = useSWR<ActivityView, Error>(
        ["GET_ACTIVITY_SWR", eventId],
        () => getActivity(eventId),
    )

    return swr
}
