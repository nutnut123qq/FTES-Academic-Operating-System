import useSWR from "swr"
import { queryUserHovercard } from "@/modules/api/graphql/queries/query-user-hovercard"

/**
 * SWR query wrapper for {@link queryUserHovercard}.
 * `data` is the unwrapped lightweight public user (or `null` when not found).
 * Keyed by the target username; runs for anonymous viewers too.
 *
 * @param username - The username of the user whose hovercard profile to fetch.
 */
export const useQueryUserHovercardSwr = (username: string | null | undefined) => {
    const swr = useSWR(
        username ? ["QUERY_USER_HOVERCARD_SWR", username] : null,
        async () => {
            const result = await queryUserHovercard({
                request: {
                    username: username as string,
                },
            })

            if (!result || !result.data) {
                throw new Error("Failed to fetch hovercard user")
            }

            return result.data.userProfile?.data ?? null
        },
    )

    return swr
}
