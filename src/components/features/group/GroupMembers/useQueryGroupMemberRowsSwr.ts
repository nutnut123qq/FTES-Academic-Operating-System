"use client"

import useSWR from "swr"
import {
    listGroupMembers,
    type GroupMember as GroupMemberDto,
} from "@/modules/api/rest/group"

/** Group member role (§7). */
export type GroupMemberRole = "owner" | "admin" | "moderator" | "member"

/**
 * Roles a manager can ASSIGN through `PATCH /groups/{id}/members/{userId}`.
 * OWNER is deliberately absent — the backend rejects it (`GROUP_USE_TRANSFER`);
 * ownership only moves through `POST /groups/{id}/transfer-ownership`.
 */
export type GroupAssignableRole = Exclude<GroupMemberRole, "owner">

/** Ordered role axis used to render the role menu. */
export const GROUP_ASSIGNABLE_ROLES: Array<GroupAssignableRole> = [
    "admin",
    "moderator",
    "member",
]

/** A member row rendered in the members tab. */
export interface GroupMemberRow {
    /** Internal user id (the membership key used by every write). */
    id: string
    /** URL-facing username — null while the BE profile join has no handle for the user. */
    username: string | null
    /** Preferred display name — null → the UI falls back to the username, then the id. */
    displayName: string | null
    /** Avatar URL from the profile join; null when the user has none. */
    avatarUrl: string | null
    /** Membership role. */
    role: GroupMemberRole
}

/**
 * Maps the BE member role (OWNER/ADMIN/MODERATOR/MEMBER) onto the FE role axis;
 * anything unrecognized falls back to "member".
 */
export const toGroupMemberRole = (role: string): GroupMemberRole => {
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

/** BE role name sent on the wire for an assignable role. */
export const toBackendRole = (role: GroupAssignableRole): string => role.toUpperCase()

/**
 * Shape the membership DTO grew when the BE started enriching members with their
 * profile card (`GroupDtos.MemberDto` → displayName/username/avatarUrl, batch-loaded
 * by `GroupAuthorEnricher`). The shared REST type has not caught up yet, and a user
 * with no profile row still gets nulls back, so every field is read DEFENSIVELY:
 * present + non-blank wins, otherwise the row falls back to the raw user id.
 */
type EnrichedGroupMemberDto = GroupMemberDto & {
    displayName?: string | null
    username?: string | null
    avatarUrl?: string | null
}

/** Trims a possibly-missing string field down to `string | null`. */
const text = (value: unknown): string | null => {
    if (typeof value !== "string") {
        return null
    }
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

/** Maps a (possibly enriched) BE membership record onto a member row. */
export const toGroupMemberRow = (dto: GroupMemberDto): GroupMemberRow => {
    const enriched = dto as EnrichedGroupMemberDto
    return {
        id: dto.userId,
        username: text(enriched.username),
        displayName: text(enriched.displayName),
        avatarUrl: text(enriched.avatarUrl),
        role: toGroupMemberRole(dto.role),
    }
}

/** SWR cache key of a group's member rows (shared by the members tab + manage transfer picker). */
export const groupMemberRowsKey = (groupId: string) => ["group-member-rows", groupId]

/**
 * Loads a group's members from the real group REST API, keeping the enriched
 * identity fields when the backend sends them. The list is capped BE-side at 50
 * rows per page (`MembershipService.MAX_PAGE_SIZE`), so the limit here matches —
 * asking for more silently returned 50 anyway.
 */
export const useQueryGroupMemberRowsSwr = (groupId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        groupId ? groupMemberRowsKey(groupId) : null,
        async (): Promise<Array<GroupMemberRow>> => {
            const members = await listGroupMembers(groupId, { limit: 50 })
            return (members ?? []).map(toGroupMemberRow)
        },
    )
    return { members: data ?? [], isLoading, error, mutate }
}
