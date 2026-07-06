"use client"

import useSWR from "swr"
import {
    getMyEventCertificates,
    type EventCertificateView,
} from "@/modules/api/rest/event"

/**
 * SWR query wrapper for {@link getMyEventCertificates}.
 */
export const useGetMyEventCertificatesSwr = () => {
    const swr = useSWR<EventCertificateView[], Error>(
        ["GET_MY_EVENT_CERTIFICATES_SWR"],
        () => getMyEventCertificates(),
    )

    return swr
}
