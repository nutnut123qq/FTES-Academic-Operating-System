"use client"

import useSWR from "swr"

/** A top-ranked student entry. */
export interface TopStudent {
    id: string
    name: string
    score: number
}

/** Subject statistics payload (mock until BE lands). */
export interface SubjectStats {
    completionRate: number
    activeStudents: number
    resources: number
    avgScore: number
    topStudents: Array<TopStudent>
}

// ponytail: mock BE — no stats endpoint yet. Deterministic sample.
const fetchStatsMock = async (): Promise<SubjectStats> => ({
    completionRate: 68,
    activeStudents: 214,
    resources: 42,
    avgScore: 7.8,
    topStudents: [
        { id: "t1", name: "Trần Minh", score: 96 },
        { id: "t2", name: "Lê An", score: 92 },
        { id: "t3", name: "Phạm Hoa", score: 90 },
        { id: "t4", name: "Vũ Nam", score: 88 },
        { id: "t5", name: "Đỗ Linh", score: 85 },
    ],
})

/** Loads a subject's statistics. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQuerySubjectStatsSwr = (subjectId: string) => {
    const { data, isLoading, error } = useSWR(
        ["subject-stats", subjectId],
        () => fetchStatsMock(),
    )
    return { stats: data, isLoading, error }
}
