"use client"

import useSWR from "swr"
import { listGroupMembers, type GroupMember } from "@/modules/api/rest/group"

/**
 * SWR query wrapper for {@link listGroupMembers}.
 */
export const useGetGroupMembersSwr = (
    id: string,
    request?: {
        role?: string
        limit?: number
    },
) => {
    const swr = useSWR<GroupMember[], Error>(
        ["GET_GROUP_MEMBERS_SWR", id, request],
        () => listGroupMembers(id, request),
    )

    return swr
}
