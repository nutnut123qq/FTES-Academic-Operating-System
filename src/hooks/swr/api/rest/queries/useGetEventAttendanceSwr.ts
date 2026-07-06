"use client"

import useSWR from "swr"
import {
    getEventAttendance,
    type EventAttendanceView,
} from "@/modules/api/rest/event"

/**
 * SWR query wrapper for {@link getEventAttendance}.
 */
export const useGetEventAttendanceSwr = (id: string) => {
    const swr = useSWR<EventAttendanceView, Error>(
        ["GET_EVENT_ATTENDANCE_SWR", id],
        () => getEventAttendance(id),
    )

    return swr
}
