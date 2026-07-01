import useSWR from "swr"
import { queryMyMilestoneTaskAttempts } from "@/modules/api/graphql/queries/query-my-milestone-task-attempts"
import { useAppSelector } from "@/redux/hooks"

/** Default page size for the attempts list. */
export const MY_MILESTONE_TASK_ATTEMPTS_LIMIT = 20

/**
 * SWR hook for a page of the viewer's milestone-task attempts. User-scoped —
 * only runs once authenticated. `data` is `{ items, total }`; offset/limit drive
 * pagination (cache key includes them so each page is cached separately).
 *
 * @param offset - row offset for the page (default 0)
 * @param limit - page size (default {@link MY_MILESTONE_TASK_ATTEMPTS_LIMIT})
 * @returns the SWR handle
 */
export const useQueryMyMilestoneTaskAttemptsSwr = (
    offset = 0,
    limit = MY_MILESTONE_TASK_ATTEMPTS_LIMIT,
) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR(
        authenticated
            ? ["QUERY_MY_MILESTONE_TASK_ATTEMPTS_SWR", offset, limit]
            : null,
        async () => {
            const result = await queryMyMilestoneTaskAttempts({
                request: { offset, limit },
            })
            return (
                result.data?.myMilestoneTaskAttempts?.data ?? {
                    items: [],
                    total: 0,
                }
            )
        },
    )
}
