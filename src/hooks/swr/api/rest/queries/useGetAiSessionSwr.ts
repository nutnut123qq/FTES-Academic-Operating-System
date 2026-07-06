"use client"

import useSWR from "swr"
import { getSession, type AiSessionView } from "@/modules/api/rest/ai"

/**
 * SWR query wrapper for {@link getSession}.
 */
export const useGetAiSessionSwr = (id: string) => {
    const swr = useSWR<AiSessionView, Error>(
        ["GET_AI_SESSION_SWR", id],
        () => getSession(id),
    )

    return swr
}
