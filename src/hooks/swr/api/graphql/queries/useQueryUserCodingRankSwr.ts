import useSWR from "swr"
import { queryUserCodingRank } from "@/modules/api/graphql/queries/query-user-coding-rank"
import type { QueryUserCodingRankData } from "@/modules/api/graphql/queries/types/user-coding-rank"

/**
 * SWR hook for a user's coding standing — global rank + percentile by solved count,
 * by id. Public — works for anonymous viewers. Returns null when the user has no
 * ranked activity; pass null/undefined userId to disable.
 *
 * @param userId - id of the user whose coding standing to fetch
 * @returns the SWR handle (data = `{ rank, percentile }`, or null)
 */
export const useQueryUserCodingRankSwr = (userId: string | null | undefined) => {
    const swr = useSWR(
        userId ? ["QUERY_USER_CODING_RANK_SWR", userId] : null,
        async (): Promise<QueryUserCodingRankData | null> => {
            const data = await queryUserCodingRank({
                request: { userId: userId as string },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch user coding rank")
            }
            return data.data.userCodingRank?.data ?? null
        },
    )
    return swr
}
