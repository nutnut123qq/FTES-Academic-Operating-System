import useSWR from "swr"
import { queryPlatformStats } from "@/modules/api/graphql/queries/query-platform-stats"
import type { PlatformStatsData } from "@/modules/api/graphql/queries/types/platform-stats"

/**
 * Loads public platform-wide counters (learners / lessons / courses / badges)
 * for the landing stat strip. Public — works for anonymous viewers. The caller
 * hides the strip on error/empty rather than rendering zeros.
 */
export const useQueryPlatformStatsSwr = () => {
    const swr = useSWR<PlatformStatsData>(
        ["QUERY_PLATFORM_STATS_SWR"],
        async () => {
            const { data } = await queryPlatformStats({})
            const envelope = data?.platformStats
            const inner = envelope?.data
            if (!envelope?.success || !inner) {
                throw new Error(
                    envelope?.error ?? envelope?.message ?? "Platform stats not found",
                )
            }
            return inner
        },
    )
    return swr
}
