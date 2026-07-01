"use client"

import useSWR from "swr"
import type { GroupType } from "./useQueryGroupsSwr"

/** A group's identity (§7, mock until BE lands). */
export interface GroupHeader {
    id: string
    name: string
    type: GroupType
    members: number
}

// ponytail: mock BE — no group endpoint yet. Derives from the id.
const fetchGroupMock = async (groupId: string): Promise<GroupHeader> => ({
    id: groupId,
    name: "CLB Lập trình FPT",
    type: "club",
    members: 320,
})

/** Loads a group's header. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryGroupSwr = (groupId: string) => {
    const { data, isLoading, error } = useSWR(["group", groupId], () => fetchGroupMock(groupId))
    return { group: data, isLoading, error }
}
