import useSWR from "swr"
import { queryUserFollowers } from "@/modules/api/graphql/queries/query-user-followers"

/**
 * SWR query wrapper for {@link queryUserFollowers}. `data` is the visible
 * follower slice (newest first) for the profile avatar group, or `[]`. Keyed by
 * username; runs for anonymous viewers too. Pair with `userProfile.followerCount`
 * for the total.
 *
 * @param username - the username whose followers to fetch.
 */
export const useQueryUserFollowersSwr = (username: string | null | undefined) => {
    return useSWR(
        username ? ["QUERY_USER_FOLLOWERS_SWR", username] : null,
        async () => {
            const data = await queryUserFollowers({
                request: {
                    username: username as string,
                },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch followers")
            }
            return data.data.userFollowers?.data ?? []
        },
    )
}
