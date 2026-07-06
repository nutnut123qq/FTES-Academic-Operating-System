"use client"

import useSWR from "swr"
import {
    getActivityTypes,
    type ActivityTypeView,
} from "@/modules/api/rest/activity"

/**
 * SWR query wrapper for {@link getActivityTypes}.
 */
export const useGetActivityTypesSwr = () => {
    const swr = useSWR<ActivityTypeView[], Error>(
        "GET_ACTIVITY_TYPES_SWR",
        () => getActivityTypes(),
    )

    return swr
}
