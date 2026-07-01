"use client"

import useSWR from "swr"

/** Group member role (§7). */
export type GroupMemberRole = "owner" | "admin" | "moderator" | "member"

/** A group member (mock until BE lands). */
export interface GroupMember {
    id: string
    name: string
    role: GroupMemberRole
}

// ponytail: mock BE — no group members endpoint yet. Deterministic sample.
const fetchGroupMembersMock = async (): Promise<Array<GroupMember>> => [
    { id: "gm1", name: "Nguyễn Chủ Nhiệm", role: "owner" },
    { id: "gm2", name: "Trần Phó CN", role: "admin" },
    { id: "gm3", name: "Lê Kiểm Duyệt", role: "moderator" },
    { id: "gm4", name: "Phạm Thành Viên", role: "member" },
    { id: "gm5", name: "Hoàng Thành Viên", role: "member" },
]

/** Loads a group's members. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryGroupMembersSwr = (groupId: string) => {
    const { data, isLoading, error } = useSWR(["group-members", groupId], () => fetchGroupMembersMock())
    return { members: data ?? [], isLoading, error }
}
