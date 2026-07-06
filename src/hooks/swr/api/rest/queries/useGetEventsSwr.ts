"use client"

import useSWR from "swr"
import { getEvents, type EventView } from "@/modules/api/rest/event"

/**
 * SWR query wrapper for {@link getEvents}.
 */
export const useGetEventsSwr = () => {
    const swr = useSWR<EventView[], Error>(["GET_EVENTS_SWR"], () => getEvents())

    return swr
}
