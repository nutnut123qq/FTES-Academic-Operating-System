import useSWR from "swr"
import { queryUserAchievements } from "@/modules/api/graphql/queries/query-user-achievements"

/**
 * SWR hook for a user's achievements (badge wall) by id. Public — works for
 * anonymous viewers. Returns the list (empty array on absent data); pass a
 * null/undefined userId to disable the fetch.
 *
 * @param userId - id of the user whose achievements to fetch
 * @returns the SWR handle (data = array of achievement items)
 */
export const useQueryUserAchievementsSwr = (userId: string | null | undefined) => {
    const swr = useSWR(
        // no key (→ no request) until we actually have a user id
        userId ? ["QUERY_USER_ACHIEVEMENTS_SWR", userId] : null,
        async () => {
            const data = await queryUserAchievements({
                request: { userId: userId as string },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch user achievements")
            }
            // unwrap the standard API envelope; default to [] when null
            return data.data.userAchievements?.data ?? []
        },
    )
    return swr
}
