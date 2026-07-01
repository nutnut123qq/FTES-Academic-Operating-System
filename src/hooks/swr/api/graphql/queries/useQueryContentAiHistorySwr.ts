import useSWR from "swr"
import { queryContentAiHistory } from "@/modules/api/graphql/queries/query-content-ai-history"
import type { ContentAiHistoryTurn } from "@/modules/api/graphql/queries/types/content-ai-history"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR query wrapper for {@link queryContentAiHistory}. Returns a conversation's
 * (session's) saved turns (oldest first), or `[]`. Runs only when authenticated
 * and a `sessionId` is present.
 */
export const useQueryContentAiHistorySwr = (sessionId: string | undefined) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWR<Array<ContentAiHistoryTurn>>(
        authenticated && sessionId
            ? ["QUERY_CONTENT_AI_HISTORY_SWR", sessionId]
            : null,
        async () => {
            const data = await queryContentAiHistory({ sessionId: sessionId as string })
            return data?.data?.messages ?? []
        },
    )
    return swr
}
