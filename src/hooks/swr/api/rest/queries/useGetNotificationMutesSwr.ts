"use client"

import useSWR from "swr"
import { getNotificationMutes, type MuteView } from "@/modules/api/rest/notification"

/**
 * SWR query wrapper for {@link getNotificationMutes}.
 */
export const useGetNotificationMutesSwr = () => {
    const swr = useSWR<Array<MuteView>, Error>(
        ["GET_NOTIFICATION_MUTES_SWR"],
        () => getNotificationMutes(),
    )

    return swr
}
