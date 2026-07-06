"use client"

import useSWR from "swr"
import { getPresence, type PresenceResponse } from "@/modules/api/rest/chat"

/**
 * SWR query wrapper for {@link getPresence}.
 */
export const useGetPresenceSwr = (userIds: string[]) => {
    const swr = useSWR<PresenceResponse, Error>(
        ["GET_PRESENCE_SWR", userIds],
        () => getPresence(userIds),
    )

    return swr
}
