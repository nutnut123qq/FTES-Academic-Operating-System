import useSWR from "swr"
import { queryUserSolvedChallenges } from "@/modules/api/graphql/queries/query-user-solved-challenges"

/**
 * SWR hook for a user's passed challenge submissions (with their submitted link),
 * by id. Public. Returns [] on absent data; pass null/undefined userId to disable.
 *
 * @param userId - id of the user whose solved challenges to fetch
 * @returns the SWR handle (data = array of passed challenge submissions)
 */
export const useQueryUserSolvedChallengesSwr = (userId: string | null | undefined) => {
    const swr = useSWR(
        userId ? ["QUERY_USER_SOLVED_CHALLENGES_SWR", userId] : null,
        async () => {
            const data = await queryUserSolvedChallenges({
                request: { userId: userId as string },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch user solved challenges")
            }
            return data.data.userSolvedChallenges?.data ?? []
        },
    )
    return swr
}
