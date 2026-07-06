"use client"

import useSWR from "swr"
import {
    getConversations,
    type ConversationResponse,
    type Page,
} from "@/modules/api/rest/chat"

/**
 * SWR query wrapper for {@link getConversations}.
 */
export const useGetConversationsSwr = (params?: { cursor?: string; limit?: number }) => {
    const swr = useSWR<Page<ConversationResponse>, Error>(
        ["GET_CONVERSATIONS_SWR", params],
        () => getConversations(params),
    )

    return swr
}
