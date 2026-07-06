"use client"

import useSWR from "swr"
import {
    getNotificationPreferences,
    type PreferenceCell,
} from "@/modules/api/rest/notification"

/**
 * SWR query wrapper for {@link getNotificationPreferences}.
 */
export const useGetNotificationPreferencesSwr = () => {
    const swr = useSWR<Array<PreferenceCell>, Error>(
        ["GET_NOTIFICATION_PREFERENCES_SWR"],
        () => getNotificationPreferences(),
    )

    return swr
}
