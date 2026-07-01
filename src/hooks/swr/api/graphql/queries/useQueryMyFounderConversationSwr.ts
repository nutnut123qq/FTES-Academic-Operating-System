import useSWR from "swr"
import { queryMyFounderConversation } from "@/modules/api/graphql/queries/query-my-founder-conversation"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR hook resolving the viewer's private founder DM conversation handle. Gated on
 * auth (the DM is keyed to the signed-in member).
 *
 * @returns the SWR handle (data = conversation | null, isLoading, error)
 */
export const useQueryMyFounderConversationSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    return useSWR(
        authenticated ? ["QUERY_MY_FOUNDER_CONVERSATION_SWR"] : null,
        async () => {
            const data = await queryMyFounderConversation({})
            return data?.data?.myFounderConversation?.data ?? null
        },
    )
}
