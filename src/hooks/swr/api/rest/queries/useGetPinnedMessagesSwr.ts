"use client"

import useSWR from "swr"
import { getPinnedMessages } from "@/modules/api/rest/chat"

/**
 * SWR query wrapper for {@link getPinnedMessages}.
 */
export const useGetPinnedMessagesSwr = (conversationId: string) => {
    const swr = useSWR<string[], Error>(
        ["GET_PINNED_MESSAGES_SWR", conversationId],
        () => getPinnedMessages(conversationId),
    )

    return swr
}
