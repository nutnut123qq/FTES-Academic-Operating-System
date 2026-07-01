"use client"

import useSWR from "swr"

/** Assignment status. */
export type AssignmentStatus = "submitted" | "pending" | "overdue"

/** A course assignment (§4, mock until BE lands). */
export interface Assignment {
    id: string
    title: string
    dueLabel: string
    status: AssignmentStatus
}

// ponytail: mock BE — no assignment endpoint yet. Deterministic sample.
const fetchAssignmentsMock = async (): Promise<Array<Assignment>> => [
    { id: "as1", title: "Bài tập 1 — Biến & kiểu dữ liệu", dueLabel: "Hạn 10/07", status: "submitted" },
    { id: "as2", title: "Bài tập 2 — Vòng lặp", dueLabel: "Hạn 17/07", status: "pending" },
    { id: "as3", title: "Bài tập 3 — Con trỏ", dueLabel: "Hạn 03/07", status: "overdue" },
]

/** Loads a course's assignments. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryAssignmentsSwr = (courseId: string) => {
    const { data, isLoading, error } = useSWR(["assignments", courseId], () => fetchAssignmentsMock())
    return { assignments: data ?? [], isLoading, error }
}
