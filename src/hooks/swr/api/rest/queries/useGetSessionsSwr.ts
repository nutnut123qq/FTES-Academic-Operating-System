"use client"

import useSWR from "swr"
import { listSessions, type SessionView } from "@/modules/api/rest/identity"

/** Shared SWR key — the settings device list and the revoke confirm modal read ONE cache. */
export const SESSIONS_SWR_KEY = "GET_SESSIONS_SWR"

/**
 * SWR query wrapper for {@link listSessions}.
 */
export const useGetSessionsSwr = () => {
    const swr = useSWR<Array<SessionView>, Error>(
        SESSIONS_SWR_KEY,
        listSessions,
    )

    return swr
}
