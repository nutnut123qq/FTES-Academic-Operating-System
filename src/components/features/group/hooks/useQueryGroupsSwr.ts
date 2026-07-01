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
}

// ponytail: mock BE — no group endpoint yet. Deterministic sample.
const fetchGroupsMock = async (): Promise<Array<Group>> => [
    { id: "g1", name: "CLB Lập trình FPT", type: "club", members: 320, description: "Sinh hoạt code, workshop hằng tuần." },
    { id: "g2", name: "Nhóm học PRF192", type: "study", members: 45, description: "Cùng ôn tập và làm bài tập C." },
    { id: "g3", name: "Team đồ án SWP391", type: "team", members: 5, description: "Nhóm 5 người làm capstone." },
    { id: "g4", name: "Cộng đồng AI/ML", type: "public", members: 780, description: "Chia sẻ kiến thức AI, LLM, dữ liệu." },
    { id: "g5", name: "Nhóm nội bộ K17", type: "private", members: 60, description: "Nhóm riêng cho khóa K17." },
]

/** Loads the groups list. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryGroupsSwr = () => {
    const { data, isLoading, error } = useSWR(["groups"], () => fetchGroupsMock())
    return { groups: data ?? [], isLoading, error }
}
