"use client"

import useSWR from "swr"
import {
    getEventRegistrationQr,
    type EventQrView,
} from "@/modules/api/rest/event"

/**
 * SWR query wrapper for {@link getEventRegistrationQr}.
 */
export const useGetEventRegistrationQrSwr = (id: string) => {
    const swr = useSWR<EventQrView, Error>(
        ["GET_EVENT_REGISTRATION_QR_SWR", id],
        () => getEventRegistrationQr(id),
    )

    return swr
}
