"use client"

import useSWR from "swr"

/** Member role within a subject workspace (§3 Members). */
export type MemberRole = "student" | "lecturer" | "contributor" | "moderator"

/** A subject workspace member (mock until BE lands). */
export interface SubjectMember {
    id: string
    /** URL-facing username (used for profile link + hovercard). */
    username: string
    /** Display name shown in the member list. */
    name: string
    role: MemberRole
}

// ponytail: mock BE — no members endpoint yet. Deterministic sample.
const fetchMembersMock = async (): Promise<Array<SubjectMember>> => [
    { id: "m1", username: "le-minh-quan" /* mock */, name: "Lê Minh Quân", role: "lecturer" },
    { id: "m2", username: "tran-thu-ha" /* mock */, name: "Trần Thu Hà", role: "moderator" },
    { id: "m3", username: "pham-gia-bao" /* mock */, name: "Phạm Gia Bảo", role: "contributor" },
    { id: "m4", username: "vu-ngoc-anh" /* mock */, name: "Vũ Ngọc Ánh", role: "student" },
    { id: "m5", username: "hoang-van-e" /* mock */, name: "Hoàng Văn E", role: "student" },
    { id: "m6", username: "vu-thi-f" /* mock */, name: "Vũ Thị F", role: "student" },
]

/** Loads a subject's members. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQuerySubjectMembersSwr = (subjectId: string) => {
    const { data, isLoading, error } = useSWR(
        ["subject-members", subjectId],
        () => fetchMembersMock(),
    )
    return { members: data ?? [], isLoading, error }
}
