"use client"

import useSWR from "swr"
import { queryMyMembership } from "@/modules/api/graphql/queries/query-my-membership"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/**
 * SWR query wrapper for {@link queryMyMembership}. `data` is the unwrapped membership
 * payload (viewer's effective plan + the plan on sale), or `null` when the envelope
 * carries none.
 *
 * Viewer-scoped: the key carries the viewer id so a second account never reads the
 * first one's membership out of the cache, and the request is skipped entirely until
 * the viewer is authenticated.
 */
export const useQueryMyMembershipSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR(
        authenticated && viewerId ? ["QUERY_MY_MEMBERSHIP_SWR", viewerId] : null,
        async () => {
            const data = await queryMyMembership({})

            if (!data || !data.data) {
                throw new Error("Failed to fetch membership")
            }

            return data.data.myMembership?.data ?? null
        },
    )

    return swr
}
