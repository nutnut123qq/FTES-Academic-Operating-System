"use client"

import useSWR from "swr"

/** Group type (§7). */
export type GroupType = "public" | "private" | "study" | "club" | "team"

/** A group in the list (§7, mock until BE lands). */
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

// ponytail: mock BE — no group endpoint yet. Deterministic sample; picsum URLs
// are seeded by the group id so every reload shows the same images. Branches
// covered on purpose: g1/g4 have both images, g2 has only an avatar, g3/g5
// have neither (fallback paths stay exercised by the UI).
const fetchGroupsMock = async (): Promise<Array<Group>> => [
    {
        id: "g1",
        name: "CLB Lập trình FPT",
        type: "club",
        members: 320,
        description: "Sinh hoạt code, workshop hằng tuần.",
        avatarUrl: "https://picsum.photos/seed/g1-avatar/200/200",
        coverUrl: "https://picsum.photos/seed/g1-cover/1200/400",
    },
    {
        id: "g2",
        name: "Nhóm học PRF192",
        type: "study",
        members: 45,
        description: "Cùng ôn tập và làm bài tập C.",
        avatarUrl: "https://picsum.photos/seed/g2-avatar/200/200",
        coverUrl: null,
    },
    {
        id: "g3",
        name: "Team đồ án SWP391",
        type: "team",
        members: 5,
        description: "Nhóm 5 người làm capstone.",
        avatarUrl: null,
        coverUrl: null,
    },
    {
        id: "g4",
        name: "Cộng đồng AI/ML",
        type: "public",
        members: 780,
        description: "Chia sẻ kiến thức AI, LLM, dữ liệu.",
        avatarUrl: "https://picsum.photos/seed/g4-avatar/200/200",
        coverUrl: "https://picsum.photos/seed/g4-cover/1200/400",
    },
    {
        id: "g5",
        name: "Nhóm nội bộ K17",
        type: "private",
        members: 60,
        description: "Nhóm riêng cho khóa K17.",
        avatarUrl: null,
        coverUrl: null,
    },
]

/** Loads the groups list. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryGroupsSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["groups"], () => fetchGroupsMock())
    return { groups: data ?? [], isLoading, error, mutate }
}
