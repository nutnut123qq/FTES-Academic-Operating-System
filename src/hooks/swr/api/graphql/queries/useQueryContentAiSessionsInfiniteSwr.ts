import useSWRInfinite from "swr/infinite"
import { queryContentAiSessions } from "@/modules/api/graphql/queries/query-content-ai-sessions"
import type { ContentAiSessionSummary } from "@/modules/api/graphql/queries/types/content-ai-sessions"
import { useAppSelector } from "@/redux/hooks"

/** Conversations per page (recency-first); a short page ends the list. */
export const CONTENT_AI_SESSIONS_PAGE_LIMIT = 20

/**
 * Offset-paginated SWR hook for the content-AI conversations list (infinite
 * scroll). Each page skips `index * PAGE_LIMIT`; a page shorter than the limit
 * ends the list. Re-keys on `(contentId, search)` so a new search resets to
 * page 0. Pass `enabled = false` (e.g. while the conversations view is hidden)
 * to suspend fetching. Runs only when authenticated.
 *
 * @param contentId - the current content (anchors the list / scopes search).
 * @param search - optional search query (searches the whole course).
 * @param enabled - when false, no request is made.
 */
export const useQueryContentAiSessionsInfiniteSwr = (
    contentId: string | undefined,
    search: string | undefined,
    enabled = true,
) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const trimmed = (search ?? "").trim()

    const getKey = (
        index: number,
        previous: ReadonlyArray<ContentAiSessionSummary> | null,
    ): readonly [string, string, string, number] | null => {
        if (!enabled || !authenticated || !contentId) {
            return null
        }
        if (previous && previous.length < CONTENT_AI_SESSIONS_PAGE_LIMIT) {
            return null
        }
        return [
            "QUERY_CONTENT_AI_SESSIONS_INFINITE_SWR",
            contentId,
            trimmed,
            index * CONTENT_AI_SESSIONS_PAGE_LIMIT,
        ]
    }

    return useSWRInfinite(
        getKey,
        async ([, currentContentId, currentSearch, offset]) => {
            const data = await queryContentAiSessions({
                contentId: currentContentId,
                search: currentSearch || undefined,
                limit: CONTENT_AI_SESSIONS_PAGE_LIMIT,
                offset,
            })
            return data?.data?.sessions ?? []
        },
    )
}
