"use client"

import useSWR from "swr"
import { getSubjectMembers } from "@/modules/api/rest/subject/subject"
import type { MemberView } from "@/modules/api/rest/subject/types"

/** Member role within a subject workspace (§3 Members). */
export type MemberRole = "student" | "lecturer" | "contributor" | "moderator"

/** A subject workspace member. */
export interface SubjectMember {
    id: string
    /** URL-facing username (used for profile link + hovercard). */
    username: string
    /** Display name shown in the member list. */
    name: string
    role: MemberRole
}

/** Maps the BE `MembershipRole` enum to the FE role facet. */
const mapRole = (role: string): MemberRole => {
    switch (role) {
        case "LECTURER":
            return "lecturer"
        case "MODERATOR":
            return "moderator"
        case "CONTRIBUTOR":
            return "contributor"
        default:
            return "student"
    }
}

/**
 * Maps a BE member row to the FE {@link SubjectMember}. The BE `MemberView` carries
 * only `{userId, role, joinedAt}` — no display name or username — so the id is used
 * as a best-effort stand-in (a profile join would be needed to resolve names). The
 * seeded subjects have zero members today, so this feeds the tab's empty state.
 */
const toMember = (member: MemberView): SubjectMember => ({
    id: member.userId,
    username: member.userId,
    name: member.userId,
    role: mapRole(member.role),
})

/** Loads a subject's members from the real BE (`GET /subjects/{code}/members`). */
export const useQuerySubjectMembersSwr = (subjectId: string) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { data, isLoading, error, mutate } = useSWR(
        code ? (["subject-members", code] as const) : null,
        async (): Promise<Array<SubjectMember>> => {
            const page = await getSubjectMembers(code, { size: 100 })
            return page.items.map(toMember)
        },
    )
    return { members: data ?? [], isLoading, error, mutate }
}
