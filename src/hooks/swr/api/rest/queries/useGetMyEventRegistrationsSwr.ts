"use client"

import useSWR from "swr"
import {
    getMyEventRegistrations,
    type EventRegistrationView,
} from "@/modules/api/rest/event"

/**
 * SWR query wrapper for {@link getMyEventRegistrations}.
 */
export const useGetMyEventRegistrationsSwr = () => {
    const swr = useSWR<EventRegistrationView[], Error>(
        ["GET_MY_EVENT_REGISTRATIONS_SWR"],
        () => getMyEventRegistrations(),
    )

    return swr
}
