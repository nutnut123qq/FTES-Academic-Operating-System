import useSWR from "swr"
import { queryUserWeeklyStats } from "@/modules/api/graphql/queries/query-user-weekly-stats"

/**
 * SWR hook for a user's streak (current + longest) by id. Public — works for
 * anonymous viewers. Returns null on absent data; pass a null/undefined userId to
 * disable the fetch.
 *
 * @param userId - id of the user whose streak to fetch
 * @returns the SWR handle (data = { streak, longestStreak } or null)
 */
export const useQueryUserWeeklyStatsSwr = (userId: string | null | undefined) => {
    const swr = useSWR(
        // no key (→ no request) until we actually have a user id
        userId ? ["QUERY_USER_WEEKLY_STATS_SWR", userId] : null,
        async () => {
            const data = await queryUserWeeklyStats({
                request: { userId: userId as string },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch user weekly stats")
            }
            // unwrap the standard API envelope; null when absent
            return data.data.userWeeklyStats?.data ?? null
        },
    )
    return swr
}
