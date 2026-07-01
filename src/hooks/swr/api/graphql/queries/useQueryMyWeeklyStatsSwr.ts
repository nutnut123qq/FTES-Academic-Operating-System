import useSWR from "swr"
import { queryMyWeeklyStats } from "@/modules/api/graphql/queries/query-my-weekly-stats"
import type { QueryMyDashboardWeeklyStatsData } from "@/modules/api/graphql/queries/types/my-dashboard"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR wrapper for {@link queryMyWeeklyStats}. `data` is the viewer's rolling
 * 7-day activity stats (streak / XP / lessons), or `null`. User-scoped — only
 * runs once the viewer is authenticated.
 */
export const useQueryMyWeeklyStatsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<QueryMyDashboardWeeklyStatsData | null>(
        authenticated ? ["QUERY_MY_WEEKLY_STATS_SWR"] : null,
        async () => {
            // unwrap the standard API envelope; null when absent
            const result = await queryMyWeeklyStats({})
            return result.data?.myWeeklyStats?.data ?? null
        },
    )
}
