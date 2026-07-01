import useSWR from "swr"
import { queryContentAiSessions } from "@/modules/api/graphql/queries/query-content-ai-sessions"
import type { ContentAiSessionSummary } from "@/modules/api/graphql/queries/types/content-ai-sessions"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR query wrapper for {@link queryContentAiSessions}. Lists the current user's
 * content-AI conversations for a content — or, when `search` is non-empty,
 * searches ALL their conversations in the course. Runs only when authenticated
 * and a `contentId` is present.
 */
export const useQueryContentAiSessionsSwr = (
    contentId: string | undefined,
    search?: string,
) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const trimmed = (search ?? "").trim()
    const swr = useSWR<Array<ContentAiSessionSummary>>(
        authenticated && contentId
            ? ["QUERY_CONTENT_AI_SESSIONS_SWR", contentId, trimmed]
            : null,
        async () => {
            const data = await queryContentAiSessions({
                contentId: contentId as string,
                search: trimmed || undefined,
            })
            return data?.data?.sessions ?? []
        },
    )
    return swr
}
