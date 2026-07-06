"use client"

import useSWR from "swr"
import { getSessions, type AiSessionView } from "@/modules/api/rest/ai"

/**
 * SWR query wrapper for {@link getSessions}.
 */
export const useGetAiSessionsSwr = (params?: {
    feature?: string
    page?: number
    size?: number
}) => {
    const swr = useSWR<AiSessionView[], Error>(
        ["GET_AI_SESSIONS_SWR", params],
        () => getSessions(params),
    )

    return swr
}
