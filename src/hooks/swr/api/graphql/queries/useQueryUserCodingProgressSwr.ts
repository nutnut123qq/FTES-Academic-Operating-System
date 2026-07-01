import useSWR from "swr"
import { queryUserCodingProgress } from "@/modules/api/graphql/queries/query-user-coding-progress"

/**
 * SWR hook for a user's coding-practice status (solved/attempted/revealed ids +
 * total points) by id. Public — works for anonymous viewers. Returns null on
 * absent data; pass a null/undefined userId to disable the fetch.
 *
 * @param userId - id of the user whose coding progress to fetch
 * @returns the SWR handle (data = MyCodingProgress or null)
 */
export const useQueryUserCodingProgressSwr = (userId: string | null | undefined) => {
    const swr = useSWR(
        // no key (→ no request) until we actually have a user id
        userId ? ["QUERY_USER_CODING_PROGRESS_SWR", userId] : null,
        async () => {
            const data = await queryUserCodingProgress({
                request: { userId: userId as string },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch user coding progress")
            }
            // unwrap the standard API envelope; null when absent
            return data.data.userCodingProgress?.data ?? null
        },
    )
    return swr
}
