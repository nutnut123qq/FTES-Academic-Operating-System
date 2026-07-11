"use client"

import useSWR from "swr"
import {
    listGroupMembers,
    type GroupMember as GroupMemberDto,
} from "@/modules/api/rest/group"

/** Group member role (§7). */
export type GroupMemberRole = "owner" | "admin" | "moderator" | "member"

/** A group member. */
export interface GroupMember {
    id: string
    /** URL-facing username (used for profile link + hovercard). */
    username: string
    /** Display name shown in the member list. */
    name: string
    role: GroupMemberRole
}

/**
 * Maps the BE member role (OWNER/ADMIN/MODERATOR/MEMBER) onto the FE role axis;
 * anything unrecognized falls back to "member".
 */
const toRole = (role: string): GroupMemberRole => {
    switch (role.toUpperCase()) {
        case "OWNER":
            return "owner"
        case "ADMIN":
            return "admin"
        case "MODERATOR":
            return "moderator"
        default:
            return "member"
    }
}

/**
 * Maps a BE membership record to the member-row shape. The membership contract
 * only carries the user id (no display name / username), so both fall back to
 * the user id until a profile-join contract lands.
 */
const toGroupMember = (dto: GroupMemberDto): GroupMember => ({
    id: dto.userId,
    username: dto.userId,
    name: dto.userId,
    role: toRole(dto.role),
})

/** Loads a group's members from the real group REST API. */
export const useQueryGroupMembersSwr = (groupId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        groupId ? ["group-members", groupId] : null,
        async (): Promise<Array<GroupMember>> => {
            const members = await listGroupMembers(groupId, { limit: 100 })
            return (members ?? []).map(toGroupMember)
        },
    )
    return { members: data ?? [], isLoading, error, mutate }
}
