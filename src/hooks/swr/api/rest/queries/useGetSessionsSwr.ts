"use client"

import useSWR from "swr"
import { listSessions, type SessionView } from "@/modules/api/rest/identity"

/**
 * SWR query wrapper for {@link listSessions}.
 */
export const useGetSessionsSwr = () => {
    const swr = useSWR<Array<SessionView>, Error>(
        "GET_SESSIONS_SWR",
        listSessions,
    )

    return swr
}
