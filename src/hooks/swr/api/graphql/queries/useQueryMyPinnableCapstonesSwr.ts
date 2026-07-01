import useSWR from "swr"
import { queryMyPinnableCapstones } from "@/modules/api/graphql/queries/query-my-pinnable-capstones"
import type { QueryMyPinnableCapstoneItemData } from "@/modules/api/graphql/queries/types/my-pinnable-capstones"
import { useAppSelector } from "@/redux/hooks"

/** SWR cache key for the current user's pinnable capstones. */
export const QUERY_MY_PINNABLE_CAPSTONES_SWR = "QUERY_MY_PINNABLE_CAPSTONES_SWR"

/**
 * SWR wrapper for {@link queryMyPinnableCapstones}. `data` is the signed-in
 * user's enrollments that have a capstone repo (the pin-picker source), or `[]`.
 * User-scoped — only runs once the viewer is authenticated.
 */
export const useQueryMyPinnableCapstonesSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<Array<QueryMyPinnableCapstoneItemData>>(
        authenticated ? [QUERY_MY_PINNABLE_CAPSTONES_SWR] : null,
        async () => {
            // unwrap the standard API envelope; empty list when absent
            const result = await queryMyPinnableCapstones({})
            return result.data?.myPinnableCapstones?.data ?? []
        },
    )
}
