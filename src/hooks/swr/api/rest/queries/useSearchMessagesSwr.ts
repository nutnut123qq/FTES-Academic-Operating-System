"use client"

import useSWR from "swr"
import { searchMessages, type ChatMessageResponse } from "@/modules/api/rest/chat"

/**
 * SWR query wrapper for {@link searchMessages}.
 */
export const useSearchMessagesSwr = (params: { q: string; limit?: number }) => {
    const swr = useSWR<ChatMessageResponse[], Error>(
        ["SEARCH_MESSAGES_SWR", params],
        () => searchMessages(params),
    )

    return swr
}
