"use client"

import useSWR from "swr"
import { getConversation, type ConversationResponse } from "@/modules/api/rest/chat"

/**
 * SWR query wrapper for {@link getConversation}.
 */
export const useGetConversationSwr = (id: string) => {
    const swr = useSWR<ConversationResponse, Error>(
        ["GET_CONVERSATION_SWR", id],
        () => getConversation(id),
    )

    return swr
}
