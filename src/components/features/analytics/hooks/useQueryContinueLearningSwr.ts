"use client"

import useSWR from "swr"

/** A "continue where you left off" item — a course + the viewer's progress in it. */
export interface ContinueLearningItem {
    id: string
    /** Course / module title. */
    title: string
    /** Secondary line — e.g. the next lesson to resume. */
    subtitle: string
    /** Completed lessons so far. */
    current: number
    /** Total lessons in the course. */
    total: number
    /** Destination when the learner presses "Resume". */
    href: string
}

// ponytail: mock BE — no resume endpoint yet. Deterministic sample courses,
// SWR-shaped for a drop-in swap (myContinueLearning()) later.
const fetchContinueLearningMock = async (): Promise<Array<ContinueLearningItem>> => [
    {
        id: "algorithms",
        title: "Cấu trúc dữ liệu & Giải thuật",
        subtitle: "Bài 8 · Cây nhị phân tìm kiếm",
        current: 7,
        total: 20,
        href: "/courses",
    },
    {
        id: "systemdesign",
        title: "System Design cơ bản",
        subtitle: "Bài 4 · Caching & CDN",
        current: 3,
        total: 12,
        href: "/courses",
    },
]

/** Loads the viewer's continue-learning items. Mocked; SWR-shaped. */
export const useQueryContinueLearningSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["analytics", "overview", "continue"],
        () => fetchContinueLearningMock(),
    )
    return { items: data ?? [], isLoading, error, mutate }
}
