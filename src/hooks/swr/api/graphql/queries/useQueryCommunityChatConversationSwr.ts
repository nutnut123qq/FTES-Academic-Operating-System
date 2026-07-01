import useSWR from "swr"
import { queryCommunityChatConversation } from "@/modules/api/graphql/queries/query-community-chat-conversation"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR hook resolving the global community chat conversation handle (id + type).
 * Gated on auth (chat is member-only; the handle itself needs a logged-in user).
 *
 * @returns the SWR handle (data = conversation | null, isLoading, error)
 */
export const useQueryCommunityChatConversationSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    return useSWR(
        authenticated ? ["QUERY_COMMUNITY_CHAT_CONVERSATION_SWR"] : null,
        async () => {
            const data = await queryCommunityChatConversation({})
            return data?.data?.communityChatConversation?.data ?? null
        },
    )
}
