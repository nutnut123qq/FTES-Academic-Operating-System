import useSWRInfinite from "swr/infinite"
import { queryMyCreditUsageHistory } from "@/modules/api/graphql/queries/query-my-credit-usage-history"
import type { QueryMyCreditUsageHistoryResponseData } from "@/modules/api/graphql/queries/types/my-credit-usage-history"
import { useAppSelector } from "@/redux/hooks"

/** Charge rows per page (offset pagination). */
export const CREDIT_USAGE_HISTORY_PAGE_LIMIT = 20

/**
 * Infinite (offset-paginated) SWR hook for the viewer's AI credit charge history
 * — the "Lịch sử dùng AI" page list. Each page = `myCreditUsageHistory(limit,
 * offset)` (offset = pageIndex × {@link CREDIT_USAGE_HISTORY_PAGE_LIMIT}); stops
 * once a page returns fewer than a full page. User-scoped (keyed `null` until
 * authenticated). Per the async rule, pagination uses `useSWRInfinite`.
 *
 * @returns the SWRInfinite handle (`data` = array of pages, `size`, `setSize`, …).
 */
export const useQueryMyCreditUsageHistoryInfiniteSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    const getKey = (
        index: number,
        previous: QueryMyCreditUsageHistoryResponseData | null,
    ): readonly [string, number] | null => {
        if (!authenticated) {
            return null
        }
        if (previous && previous.items.length < CREDIT_USAGE_HISTORY_PAGE_LIMIT) {
            return null
        }
        return ["QUERY_MY_CREDIT_USAGE_HISTORY_INFINITE_SWR", index]
    }

    return useSWRInfinite(
        getKey,
        async ([, index]) => {
            const response = await queryMyCreditUsageHistory({
                request: {
                    offset: index * CREDIT_USAGE_HISTORY_PAGE_LIMIT,
                    limit: CREDIT_USAGE_HISTORY_PAGE_LIMIT,
                },
            })
            const payload = response.data?.myCreditUsageHistory.data
            if (!payload) {
                throw new Error("Failed to fetch credit usage history")
            }
            return payload
        },
    )
}
