import useSWR from "swr"
import { querySuggestedUsers } from "@/modules/api/graphql/queries/query-suggested-users"
import type { QuerySuggestedUserData } from "@/modules/api/graphql/queries/types/suggested-users"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR wrapper for {@link querySuggestedUsers}. `data` is the list of users
 * suggested to the viewer for following, or `null`. User-scoped — only runs once
 * the viewer is authenticated.
 */
export const useQuerySuggestedUsersSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<Array<QuerySuggestedUserData> | null>(
        authenticated ? ["QUERY_SUGGESTED_USERS_SWR"] : null,
        async () => {
            // unwrap the standard API envelope; null when absent
            const result = await querySuggestedUsers({})
            return result.data?.suggestedUsers?.data ?? null
        },
    )
}
