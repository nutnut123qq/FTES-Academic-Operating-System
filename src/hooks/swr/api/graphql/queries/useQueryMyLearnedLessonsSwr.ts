import useSWR from "swr"
import { queryMyLearnedLessons } from "@/modules/api/graphql/queries/query-my-learned-lessons"
import type { QueryMyDashboardRefItemData } from "@/modules/api/graphql/queries/types/my-dashboard"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR wrapper for {@link queryMyLearnedLessons}. `data` is the viewer's recently
 * read lessons (newest first) as rail tokens, or `[]`. User-scoped — only runs
 * once the viewer is authenticated.
 */
export const useQueryMyLearnedLessonsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<Array<QueryMyDashboardRefItemData>>(
        authenticated ? ["QUERY_MY_LEARNED_LESSONS_SWR"] : null,
        async () => {
            // unwrap the standard API envelope; empty list when absent
            const result = await queryMyLearnedLessons({})
            return result.data?.myLearnedLessons?.data ?? []
        },
    )
}
