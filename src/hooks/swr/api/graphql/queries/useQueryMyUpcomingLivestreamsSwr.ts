import useSWR from "swr"
import { queryMyUpcomingLivestreams } from "@/modules/api/graphql/queries/query-my-upcoming-livestreams"
import type { QueryMyUpcomingLivestreamData } from "@/modules/api/graphql/queries/types/my-upcoming-livestreams"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR wrapper for {@link queryMyUpcomingLivestreams}. `data` is the viewer's
 * upcoming livestream sessions (soonest first), or `null`. User-scoped — only
 * runs once the viewer is authenticated.
 */
export const useQueryMyUpcomingLivestreamsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<Array<QueryMyUpcomingLivestreamData> | null>(
        authenticated ? ["QUERY_MY_UPCOMING_LIVESTREAMS_SWR"] : null,
        async () => {
            // unwrap the standard API envelope; null when absent
            const result = await queryMyUpcomingLivestreams({})
            return result.data?.myUpcomingLivestreams?.data ?? null
        },
    )
}
