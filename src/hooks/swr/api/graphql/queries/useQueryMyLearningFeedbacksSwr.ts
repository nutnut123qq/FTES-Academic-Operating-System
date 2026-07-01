import useSWR from "swr"
import { queryMyLearningFeedbacks } from "@/modules/api/graphql/queries/query-my-learning-feedbacks"
import { useAppSelector } from "@/redux/hooks"

/** Default page size for the feedback list. */
export const MY_LEARNING_FEEDBACKS_LIMIT = 20

/**
 * SWR hook for a page of the viewer's learning feedbacks. User-scoped — only
 * runs once authenticated. `data` is `{ items, total }`; offset/limit drive
 * pagination (cache key includes them so each page is cached separately).
 *
 * @param offset - row offset for the page (default 0)
 * @param limit - page size (default {@link MY_LEARNING_FEEDBACKS_LIMIT})
 * @returns the SWR handle
 */
export const useQueryMyLearningFeedbacksSwr = (
    offset = 0,
    limit = MY_LEARNING_FEEDBACKS_LIMIT,
) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR(
        authenticated
            ? ["QUERY_MY_LEARNING_FEEDBACKS_SWR", offset, limit]
            : null,
        async () => {
            const result = await queryMyLearningFeedbacks({
                request: { offset, limit },
            })
            return (
                result.data?.myLearningFeedbacks?.data ?? {
                    items: [],
                    total: 0,
                }
            )
        },
    )
}
