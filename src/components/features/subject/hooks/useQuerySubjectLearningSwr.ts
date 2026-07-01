"use client"

import useSWR from "swr"

/** A lesson within a section (mock until BE lands). */
export interface Lesson {
    id: string
    title: string
    completed: boolean
}

/** A course section grouping lessons (§4 Course System). */
export interface Section {
    id: string
    title: string
    lessons: Array<Lesson>
}

// ponytail: mock BE — no course/lesson endpoint yet. Deterministic sample.
const fetchLearningMock = async (): Promise<Array<Section>> => [
    {
        id: "s1",
        title: "Chương 1 — Nhập môn C",
        lessons: [
            { id: "l1", title: "Giới thiệu ngôn ngữ C", completed: true },
            { id: "l2", title: "Biến, kiểu dữ liệu, toán tử", completed: true },
            { id: "l3", title: "Câu lệnh điều kiện", completed: false },
        ],
    },
    {
        id: "s2",
        title: "Chương 2 — Vòng lặp & Hàm",
        lessons: [
            { id: "l4", title: "Vòng lặp for / while", completed: false },
            { id: "l5", title: "Hàm và phạm vi biến", completed: false },
        ],
    },
    {
        id: "s3",
        title: "Chương 3 — Mảng & Con trỏ",
        lessons: [
            { id: "l6", title: "Mảng một chiều", completed: false },
            { id: "l7", title: "Con trỏ cơ bản", completed: false },
        ],
    },
]

/** Loads a subject's learning sections. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQuerySubjectLearningSwr = (subjectId: string) => {
    const { data, isLoading, error } = useSWR(
        ["subject-learning", subjectId],
        () => fetchLearningMock(),
    )
    const sections = data ?? []
    const lessons = sections.flatMap((s) => s.lessons)
    const total = lessons.length
    const done = lessons.filter((l) => l.completed).length
    const percent = total === 0 ? 0 : Math.round((done / total) * 100)
    return { sections, total, done, percent, isLoading, error }
}
