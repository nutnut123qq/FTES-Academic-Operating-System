import useSWR from "swr"
import { queryUserProfile } from "@/modules/api/graphql/queries/query-user-profile"

/**
 * SWR query wrapper for {@link queryUserProfile}. `data` is the unwrapped public
 * user (or `null` when not found). Keyed by the target username; runs whenever a
 * username is provided (works for anonymous viewers too). The returned entity
 * carries `id`, which the follow mutation + the profile tabs key off.
 *
 * @param username - The username of the user whose public profile to fetch.
 */
export const useQueryUserProfileSwr = (username: string | null | undefined) => {
    const swr = useSWR(
        username ? ["QUERY_USER_PROFILE_SWR", username] : null,
        async () => {
            const data = await queryUserProfile({
                request: {
                    username: username as string,
                },
            })

            if (!data || !data.data) {
                throw new Error("Failed to fetch user profile")
            }

            return data.data.userProfile?.data ?? null
        },
    )

    return swr
}
