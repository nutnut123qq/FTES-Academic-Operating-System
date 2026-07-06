"use client"

import useSWR from "swr"
import { getEventDetail, type EventView } from "@/modules/api/rest/event"

/**
 * SWR query wrapper for {@link getEventDetail}.
 */
export const useGetEventDetailSwr = (slug: string) => {
    const swr = useSWR<EventView, Error>(
        ["GET_EVENT_DETAIL_SWR", slug],
        () => getEventDetail(slug),
    )

    return swr
}
