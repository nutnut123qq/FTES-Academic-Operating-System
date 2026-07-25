"use client"

import useSWR from "swr"
import { getGroup } from "@/modules/api/rest/group"

/** Join policies the BE accepts (`GroupService.JOIN_POLICY`). */
export const GROUP_JOIN_POLICIES = ["OPEN", "APPROVAL", "INVITE_ONLY"] as const

/** Visibilities the BE accepts (`GroupService.VISIBILITY`). */
export const GROUP_VISIBILITIES = ["PUBLIC", "PRIVATE"] as const

/** One of {@link GROUP_JOIN_POLICIES}. */
export type GroupJoinPolicy = (typeof GROUP_JOIN_POLICIES)[number]

/** One of {@link GROUP_VISIBILITIES}. */
export type GroupVisibility = (typeof GROUP_VISIBILITIES)[number]

/** Editable settings of a group (the fields `PATCH /groups/{id}` accepts). */
export interface GroupSettings {
    name: string
    description: string
    joinPolicy: GroupJoinPolicy
    visibility: GroupVisibility
    /** Owner id — gates the owner-only danger zone (archive / transfer). */
    ownerId: string
    /** BE status; "ARCHIVED" disables the archive action. */
    status: string
}

/** SWR cache key of a group's editable settings. */
export const groupSettingsKey = (groupId: string) => ["group-settings", groupId]

/** Narrows a raw BE string onto the join-policy axis (unknown → OPEN). */
const toJoinPolicy = (value?: string): GroupJoinPolicy =>
    GROUP_JOIN_POLICIES.find((policy) => policy === value) ?? "OPEN"

/** Narrows a raw BE string onto the visibility axis (unknown → PUBLIC). */
const toVisibility = (value?: string): GroupVisibility =>
    GROUP_VISIBILITIES.find((visibility) => visibility === value) ?? "PUBLIC"

/**
 * Loads the group fields the management form edits. The header hook
 * (`useQueryGroupSwr`) projects the group down to its display identity and drops
 * description/joinPolicy/visibility, so the form reads the group under its own key
 * and revalidates the header key after a save.
 */
export const useQueryGroupSettingsSwr = (groupId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        groupId ? groupSettingsKey(groupId) : null,
        async (): Promise<GroupSettings> => {
            const dto = await getGroup(groupId)
            return {
                name: dto.name,
                description: dto.description ?? "",
                joinPolicy: toJoinPolicy(dto.joinPolicy),
                visibility: toVisibility(dto.visibility),
                ownerId: dto.ownerId,
                status: dto.status,
            }
        },
    )
    return { settings: data, isLoading, error, mutate }
}
