import useSWR from "swr"
import { queryUserCapstoneProgress } from "@/modules/api/graphql/queries/query-user-capstone-progress"

/**
 * SWR hook for a user's per-course personal-project capstone progress by id.
 * Public — works for anonymous viewers. Returns [] on absent data; pass
 * null/undefined userId to disable.
 *
 * @param userId - id of the user whose capstone progress to fetch
 * @returns the SWR handle (data = array of per-course capstone progress)
 */
export const useQueryUserCapstoneProgressSwr = (userId: string | null | undefined) => {
    const swr = useSWR(
        userId ? ["QUERY_USER_CAPSTONE_PROGRESS_SWR", userId] : null,
        async () => {
            const data = await queryUserCapstoneProgress({
                request: { userId: userId as string },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch user capstone progress")
            }
            return data.data.userCapstoneProgress?.data ?? []
        },
    )
    return swr
}
