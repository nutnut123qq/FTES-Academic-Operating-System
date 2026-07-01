import useSWR from "swr"
import { queryUserChallengeStrength } from "@/modules/api/graphql/queries/query-user-challenge-strength"
import type { QueryUserChallengeStrengthData } from "@/modules/api/graphql/queries/types/user-challenge-strength"

/**
 * SWR hook for a user's difficulty-weighted challenge-strength stats (global
 * percentile + rank), by id. Public — works for anonymous viewers. Returns null
 * when the user has no passed challenges; pass null/undefined userId to disable.
 *
 * @param userId - id of the user whose challenge strength to fetch
 * @returns the SWR handle (data = `{ percentile, rank }`, or null)
 */
export const useQueryUserChallengeStrengthSwr = (userId: string | null | undefined) => {
    const swr = useSWR(
        userId ? ["QUERY_USER_CHALLENGE_STRENGTH_SWR", userId] : null,
        async (): Promise<QueryUserChallengeStrengthData | null> => {
            const data = await queryUserChallengeStrength({
                request: { userId: userId as string },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch user challenge strength")
            }
            return data.data.userChallengeStrength?.data ?? null
        },
    )
    return swr
}
