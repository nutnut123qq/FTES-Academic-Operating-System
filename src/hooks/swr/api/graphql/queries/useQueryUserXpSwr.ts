import useSWR from "swr"
import { queryUserXp } from "@/modules/api/graphql/queries/query-user-xp"
import type { QueryUserXpData } from "@/modules/api/graphql/queries/types/user-xp"

/**
 * SWR hook for a user's per-source XP breakdown (challenge / milestone / coding /
 * lesson) plus total and reward-points balances, by id. Public — works for
 * anonymous viewers. Returns null when the user has earned nothing yet; pass
 * null/undefined userId to disable.
 *
 * @param userId - id of the user whose XP breakdown to fetch
 * @returns the SWR handle (data = `{ challengeXp, milestoneXp, codingXp, lessonXp, totalPoints, rewardPoints }`, or null)
 */
export const useQueryUserXpSwr = (userId: string | null | undefined) => {
    const swr = useSWR(
        userId ? ["QUERY_USER_XP_SWR", userId] : null,
        async (): Promise<QueryUserXpData | null> => {
            const data = await queryUserXp({
                request: { userId: userId as string },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch user XP")
            }
            return data.data.userXp?.data ?? null
        },
    )
    return swr
}
