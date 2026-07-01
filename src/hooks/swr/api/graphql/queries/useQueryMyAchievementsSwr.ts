import useSWR from "swr"
import { queryMyAchievements } from "@/modules/api/graphql/queries/query-my-achievements"
import type { QueryMyAchievementsData } from "@/modules/api/graphql/queries/types/achievements"
import { useAppSelector } from "@/redux/hooks"

/** Empty payload used until the query resolves / when unauthenticated. */
const EMPTY: QueryMyAchievementsData = {
    data: [],
    count: 0,
    newAchievements: [],
}

/**
 * SWR wrapper for {@link queryMyAchievements}. Returns `{ data, count,
 * newAchievements }` — the full badge wall, the earned count, plus the subset
 * newly earned on this read (the backend awards-on-read, so opening this grants
 * any newly-qualified badge). User-scoped — only runs once authenticated.
 */
export const useQueryMyAchievementsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<QueryMyAchievementsData>(
        authenticated ? ["QUERY_MY_ACHIEVEMENTS_SWR"] : null,
        async () => {
            // unwrap the standard API envelope; empty payload when absent
            const result = await queryMyAchievements({})
            return result.data?.myAchievements?.data ?? EMPTY
        },
    )
}
