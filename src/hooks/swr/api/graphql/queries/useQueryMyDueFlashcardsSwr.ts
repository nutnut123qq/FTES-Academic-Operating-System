import useSWR from "swr"
import { queryMyDueFlashcards } from "@/modules/api/graphql/queries/query-my-due-flashcards"
import type { QueryMyDueFlashcardsData } from "@/modules/api/graphql/queries/types/my-due-flashcards"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR wrapper for {@link queryMyDueFlashcards}. `data` is the viewer's due-card
 * count plus the cards to review (SM-2), or `null`. User-scoped — only runs once
 * the viewer is authenticated.
 *
 * @param courseId - optional course scope; omit for a global (cross-course) queue (dashboard).
 * @param limit - optional cap on the number of cards fetched.
 */
export const useQueryMyDueFlashcardsSwr = (courseId?: string, limit?: number) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<QueryMyDueFlashcardsData | null>(
        authenticated ? ["QUERY_MY_DUE_FLASHCARDS_SWR", courseId ?? null, limit ?? null] : null,
        async () => {
            // unwrap the standard API envelope; null when absent
            const result = await queryMyDueFlashcards({
                request: { courseId, limit },
            })
            return result.data?.myDueFlashcards?.data ?? null
        },
    )
}
