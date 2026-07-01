import useSWR from "swr"
import { queryChatMessages } from "@/modules/api/graphql/queries/query-chat-messages"

/** How many recent messages to load. */
const PAGE_LIMIT = 50

/**
 * SWR hook for a conversation's recent messages (newest-first). Keyed by
 * `conversationId`; pass `null` to disable until a conversation is selected.
 * Access is enforced server-side (member-only + DM ownership).
 *
 * @param conversationId - conversation to load, or null to skip
 * @returns the SWR handle (data = { items, nextCursor }, isLoading, error, mutate)
 */
export const useQueryChatMessagesSwr = (conversationId: string | null) => {
    return useSWR(
        conversationId ? ["QUERY_CHAT_MESSAGES_SWR", conversationId] : null,
        async ([, id]) => {
            const data = await queryChatMessages({
                request: {
                    conversationId: id,
                    limit: PAGE_LIMIT,
                },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch messages")
            }
            return data.data.chatMessages?.data ?? { items: [], nextCursor: null }
        },
    )
}
