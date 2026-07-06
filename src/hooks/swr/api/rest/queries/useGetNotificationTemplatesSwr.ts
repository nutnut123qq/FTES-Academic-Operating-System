"use client"

import useSWR from "swr"
import {
    listNotificationTemplates,
    type TemplateView,
} from "@/modules/api/rest/notification"

/**
 * SWR query wrapper for {@link listNotificationTemplates}.
 */
export const useGetNotificationTemplatesSwr = () => {
    const swr = useSWR<Array<TemplateView>, Error>(
        ["GET_NOTIFICATION_TEMPLATES_SWR"],
        () => listNotificationTemplates(),
    )

    return swr
}
