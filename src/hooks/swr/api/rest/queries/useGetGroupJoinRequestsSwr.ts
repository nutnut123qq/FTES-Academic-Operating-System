"use client"

import useSWR from "swr"
import {
    listJoinRequests,
    type GroupJoinRequest,
} from "@/modules/api/rest/group"

/**
 * SWR query wrapper for {@link listJoinRequests}.
 */
export const useGetGroupJoinRequestsSwr = (
    id: string,
    request?: {
        status?: string
        limit?: number
    },
) => {
    const swr = useSWR<GroupJoinRequest[], Error>(
        ["GET_GROUP_JOIN_REQUESTS_SWR", id, request],
        () => listJoinRequests(id, request),
    )

    return swr
}
