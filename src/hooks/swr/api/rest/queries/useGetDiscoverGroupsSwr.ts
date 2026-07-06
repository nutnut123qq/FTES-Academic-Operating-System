"use client"

import useSWR from "swr"
import {
    discoverGroups,
    type GroupPage,
    type GroupResponse,
} from "@/modules/api/rest/group"

/**
 * SWR query wrapper for {@link discoverGroups}.
 */
export const useGetDiscoverGroupsSwr = (request?: {
    type?: string
    campus?: string
    q?: string
    cursor?: string
    limit?: number
}) => {
    const swr = useSWR<GroupPage<GroupResponse>, Error>(
        ["GET_DISCOVER_GROUPS_SWR", request],
        () => discoverGroups(request),
    )

    return swr
}
