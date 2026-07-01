import useSWR from "swr"
import { queryUserCodingHistory } from "@/modules/api/graphql/queries/query-user-coding-history"

/**
 * SWR hook for a user's solved coding problems + languages used, by id. Public.
 * Returns [] on absent data; pass null/undefined userId to disable.
 *
 * @param userId - id of the user whose coding history to fetch
 * @returns the SWR handle (data = array of solved problems)
 */
export const useQueryUserCodingHistorySwr = (userId: string | null | undefined) => {
    const swr = useSWR(
        userId ? ["QUERY_USER_CODING_HISTORY_SWR", userId] : null,
        async () => {
            const data = await queryUserCodingHistory({
                request: { userId: userId as string },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch user coding history")
            }
            return data.data.userCodingHistory?.data ?? []
        },
    )
    return swr
}
