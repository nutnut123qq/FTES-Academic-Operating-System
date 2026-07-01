"use client"

import useSWR from "swr"

/** A lesson document attachment. */
export interface LessonDoc {
    id: string
    title: string
}

/** A lesson view (§4, mock until BE lands). */
export interface LessonView {
    id: string
    title: string
    docs: Array<LessonDoc>
    prevId: string | null
    nextId: string | null
}

// ponytail: mock BE — no lesson endpoint yet. Derives from the id.
const fetchLessonMock = async (lessonId: string): Promise<LessonView> => ({
    id: lessonId,
    title: "Con trỏ trong C",
    docs: [
        { id: "d1", title: "Slide bài giảng.pdf" },
        { id: "d2", title: "Source code ví dụ.zip" },
    ],
    prevId: "l1",
    nextId: "l3",
})

/** Loads a lesson. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryLessonSwr = (courseId: string, lessonId: string) => {
    const { data, isLoading, error } = useSWR(
        ["lesson", courseId, lessonId],
        () => fetchLessonMock(lessonId),
    )
    return { lesson: data, isLoading, error }
}
