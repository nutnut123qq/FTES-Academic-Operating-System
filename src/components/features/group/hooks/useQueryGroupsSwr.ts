"use client"

import useSWR from "swr"
import { discoverGroups, type GroupResponse } from "@/modules/api/rest/group"

/** Group type (§7). */
export type GroupType = "public" | "private" | "study" | "club" | "team"

/** A group in the list (§7). */
export interface Group {
    id: string
    name: string
    type: GroupType
    members: number
    description: string
    /** Group avatar URL; null = no avatar yet (UI falls back to initials). */
    avatarUrl: string | null
    /** Group cover/banner URL; null = no cover yet (UI falls back to a gradient). */
    coverUrl: string | null
}

/**
 * Maps the BE group kind + visibility onto the FE's single `type` filter axis.
 * BE `groupType` ∈ {GENERAL, STUDY_GROUP, CLUB, PROJECT_TEAM}; a GENERAL group
 * falls back to its visibility (PUBLIC/PRIVATE).
 */
const toGroupType = (dto: GroupResponse): GroupType => {
    switch (dto.groupType) {
        case "STUDY_GROUP":
            return "study"
        case "CLUB":
            return "club"
        case "PROJECT_TEAM":
            return "team"
        default:
            return dto.visibility === "PRIVATE" ? "private" : "public"
    }
}

/** Maps a BE group to the list-card shape (BE has no avatar/cover → null fallbacks). */
const toGroup = (dto: GroupResponse): Group => ({
    id: dto.id,
    name: dto.name,
    type: toGroupType(dto),
    members: dto.memberCount ?? 0,
    description: dto.description ?? "",
    avatarUrl: null,
    coverUrl: null,
})

/** Loads the discoverable groups list from the real group REST API. */
export const useQueryGroupsSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["GET_GROUPS_DISCOVER"], async () => {
        const page = await discoverGroups({ limit: 50 })
        return (page.items ?? []).map(toGroup)
    })
    return { groups: data ?? [], isLoading, error, mutate }
}
