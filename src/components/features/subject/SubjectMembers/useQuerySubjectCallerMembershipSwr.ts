"use client"

import useSWR from "swr"
import { getMySubjects } from "@/modules/api/rest/subject/subject"

/** Backend `MembershipRole` values (`vn.ftes.aos.subject.domain.MembershipRole`). */
export type SubjectMembershipRole =
    | "STUDENT"
    | "LECTURER"
    | "CONTRIBUTOR"
    | "MODERATOR"

/** Roles allowed to run the member-row actions (role change / ban). */
const MANAGER_ROLES: Array<SubjectMembershipRole> = ["MODERATOR", "LECTURER"]

/**
 * Resolves the **caller's** membership role in a subject.
 *
 * The workspace aggregate carries `callerMembership`, but the FE client calls
 * `GET /subjects/{code}/workspace` as a public endpoint (`authenticated: false`,
 * i.e. no bearer token attached), so that field is always `null` there. The
 * auth-scoped `GET /subjects/me` list is the reliable source, so the row for
 * this subject code is picked out of it instead.
 *
 * @param subjectId - the `[subjectId]` route segment (a subject code).
 * @param enabled - skip the fetch for guests (nothing to resolve).
 */
export const useQuerySubjectCallerMembershipSwr = (
    subjectId: string,
    enabled = true,
) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { data, isLoading, error, mutate } = useSWR(
        enabled && code ? (["subject-caller-membership", code] as const) : null,
        async (): Promise<SubjectMembershipRole | null> => {
            const memberships = (await getMySubjects()) ?? []
            const mine = memberships.find(
                (membership) => membership.code?.toUpperCase() === code,
            )
            return (mine?.role as SubjectMembershipRole | undefined) ?? null
        },
    )

    const role = data ?? null
    return {
        role,
        /** True when the caller may change roles / ban in this subject. */
        canManage: role !== null && MANAGER_ROLES.includes(role),
        isLoading,
        error,
        mutate,
    }
}
