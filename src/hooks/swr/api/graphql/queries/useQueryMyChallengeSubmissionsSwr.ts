import useSWR from "swr"
import { queryMyChallengeSubmissions } from "@/modules/api/graphql/queries/query-my-challenge-submissions"
import { useAppSelector } from "@/redux/hooks"

/** Default page size for the submissions list. */
export const MY_CHALLENGE_SUBMISSIONS_LIMIT = 20

/**
 * SWR hook for a page of the viewer's challenge submissions. User-scoped — only
 * runs once authenticated. `data` is `{ items, total }`; offset/limit drive
 * pagination (cache key includes them so each page is cached separately).
 *
 * @param offset - row offset for the page (default 0)
 * @param limit - page size (default {@link MY_CHALLENGE_SUBMISSIONS_LIMIT})
 * @returns the SWR handle
 */
export const useQueryMyChallengeSubmissionsSwr = (
    offset = 0,
    limit = MY_CHALLENGE_SUBMISSIONS_LIMIT,
) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR(
        authenticated
            ? ["QUERY_MY_CHALLENGE_SUBMISSIONS_SWR", offset, limit]
            : null,
        async () => {
            const result = await queryMyChallengeSubmissions({
                request: { offset, limit },
            })
            return (
                result.data?.myChallengeSubmissions?.data ?? {
                    items: [],
                    total: 0,
                }
            )
        },
    )
}
