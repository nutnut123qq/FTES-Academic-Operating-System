"use client"

import useSWR from "swr"

/** Group member role (§7). */
export type GroupMemberRole = "owner" | "admin" | "moderator" | "member"

/** A group member (mock until BE lands). */
export interface GroupMember {
    id: string
    /** URL-facing username (used for profile link + hovercard). */
    username: string
    /** Display name shown in the member list. */
    name: string
    role: GroupMemberRole
}

// ponytail: mock BE — no group members endpoint yet. Deterministic sample.
const fetchGroupMembersMock = async (): Promise<Array<GroupMember>> => [
    { id: "gm1", username: "nguyen-chu-nhiem" /* mock */, name: "Nguyễn Chủ Nhiệm", role: "owner" },
    { id: "gm2", username: "tran-pho-cn" /* mock */, name: "Trần Phó CN", role: "admin" },
    { id: "gm3", username: "le-kiem-duyet" /* mock */, name: "Lê Kiểm Duyệt", role: "moderator" },
    { id: "gm4", username: "pham-thanh-vien" /* mock */, name: "Phạm Thành Viên", role: "member" },
    { id: "gm5", username: "hoang-thanh-vien" /* mock */, name: "Hoàng Thành Viên", role: "member" },
]

/** Loads a group's members. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryGroupMembersSwr = (groupId: string) => {
    const { data, isLoading, error, mutate } = useSWR(["group-members", groupId], () => fetchGroupMembersMock())
    return { members: data ?? [], isLoading, error, mutate }
}
