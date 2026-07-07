"use client"

import useSWR from "swr"
import { getGroup, type GroupResponse } from "@/modules/api/rest/group"
import type { GroupType } from "./useQueryGroupsSwr"

/** A group's identity (§7). */
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

/** Maps BE group kind + visibility onto the FE `type` axis (see useQueryGroupsSwr). */
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

/** Loads a group's header from the real group REST API (BE has no avatar/cover → null). */
export const useQueryGroupSwr = (groupId: string) => {
    const { data, isLoading, error } = useSWR(
        groupId ? ["GET_GROUP", groupId] : null,
        async (): Promise<GroupHeader> => {
            const dto = await getGroup(groupId)
            return {
                id: dto.id,
                name: dto.name,
                type: toGroupType(dto),
                members: dto.memberCount ?? 0,
                avatarUrl: null,
                coverUrl: null,
            }
        },
    )
    return { group: data, isLoading, error }
}
