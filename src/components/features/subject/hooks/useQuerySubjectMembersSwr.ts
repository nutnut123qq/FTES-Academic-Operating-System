"use client"

import useSWR from "swr"

/** Member role within a subject workspace (§3 Members). */
export type MemberRole = "student" | "lecturer" | "contributor" | "moderator"

/** A subject workspace member (mock until BE lands). */
export interface SubjectMember {
    id: string
    name: string
    role: MemberRole
}

// ponytail: mock BE — no members endpoint yet. Deterministic sample.
const fetchMembersMock = async (): Promise<Array<SubjectMember>> => [
    { id: "m1", name: "Nguyễn Văn A", role: "lecturer" },
    { id: "m2", name: "Trần Thị B", role: "moderator" },
    { id: "m3", name: "Lê Văn C", role: "contributor" },
    { id: "m4", name: "Phạm Thị D", role: "student" },
    { id: "m5", name: "Hoàng Văn E", role: "student" },
    { id: "m6", name: "Vũ Thị F", role: "student" },
]

/** Loads a subject's members. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQuerySubjectMembersSwr = (subjectId: string) => {
    const { data, isLoading, error } = useSWR(
        ["subject-members", subjectId],
        () => fetchMembersMock(),
    )
    return { members: data ?? [], isLoading, error }
}
