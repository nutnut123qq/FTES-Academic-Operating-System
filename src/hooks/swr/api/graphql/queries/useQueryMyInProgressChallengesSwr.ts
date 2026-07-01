import useSWR from "swr"
import { queryMyInProgressChallenges } from "@/modules/api/graphql/queries/query-my-in-progress-challenges"
import type { QueryMyDashboardRefItemData } from "@/modules/api/graphql/queries/types/my-dashboard"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR wrapper for {@link queryMyInProgressChallenges}. `data` is the challenges
 * the viewer started but hasn't passed, as rail tokens, or `[]`. User-scoped —
 * only runs once the viewer is authenticated.
 */
export const useQueryMyInProgressChallengesSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<Array<QueryMyDashboardRefItemData>>(
        authenticated ? ["QUERY_MY_IN_PROGRESS_CHALLENGES_SWR"] : null,
        async () => {
            // unwrap the standard API envelope; empty list when absent
            const result = await queryMyInProgressChallenges({})
            return result.data?.myInProgressChallenges?.data ?? []
        },
    )
}
