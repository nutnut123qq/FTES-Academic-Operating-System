"use client"

import useSWR from "swr"
import type { GroupType } from "./useQueryGroupsSwr"

/** A group's identity (§7, mock until BE lands). */
export interface GroupHeader {
    id: string
    name: string
    type: GroupType
    members: number
    /** Group avatar URL; null = no avatar yet (UI falls back to initials). */
    avatarUrl: string | null
    /** Group cover/banner URL; null = no cover yet (UI falls back to a gradient). */
    coverUrl: string | null
}

// ponytail: mock BE — no group endpoint yet. Derives from the id; picsum URLs
// are seeded by the group id so the header images are deterministic.
const fetchGroupMock = async (groupId: string): Promise<GroupHeader> => ({
    id: groupId,
    name: "CLB Lập trình FPT",
    type: "club",
    members: 320,
    avatarUrl: `https://picsum.photos/seed/${groupId}-avatar/200/200`,
    coverUrl: `https://picsum.photos/seed/${groupId}-cover/1200/400`,
})

/** Loads a group's header. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryGroupSwr = (groupId: string) => {
    const { data, isLoading, error } = useSWR(["group", groupId], () => fetchGroupMock(groupId))
    return { group: data, isLoading, error }
}
