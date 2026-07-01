import useSWR from "swr"
import { useAppSelector } from "@/redux/hooks"
import { AiQuotaTab } from "@/redux/slices/tabs"
import { queryMyCreditUsageHistory } from "@/modules/api/graphql/queries/query-my-credit-usage-history"
import { useAiQuotaOverlayState } from "@/hooks/zustand/overlay/hooks"

/** Params for {@link useAiQuotaHistorySwr}. */
export interface UseAiQuotaHistorySwrParams {
    /** When true, fetch even if the modal is closed (e.g. `/profile/ai-usage`). */
    enabled?: boolean
}

/**
 * Credit-usage history for the AI quota modal History tab or full usage page.
 * @param params - Optional {@link UseAiQuotaHistorySwrParams}
 */
export const useAiQuotaHistorySwr = (
    params?: UseAiQuotaHistorySwrParams,
) => {
    const {
        isOpen,
    } = useAiQuotaOverlayState()
    const tab = useAppSelector((state) => state.tabs.aiQuotaTab)
    const shouldFetch = params?.enabled
        || (isOpen && tab === AiQuotaTab.History)

    return useSWR(
        shouldFetch
            ? ["QUERY_MY_CREDIT_USAGE_HISTORY_SWR"]
            : null,
        async () => {
            const response = await queryMyCreditUsageHistory({
                request: { limit: 100 },
            })
            const payload = response.data?.myCreditUsageHistory.data
            if (!payload) {
                throw new Error("Failed to fetch credit usage history")
            }
            return payload
        },
    )
}
