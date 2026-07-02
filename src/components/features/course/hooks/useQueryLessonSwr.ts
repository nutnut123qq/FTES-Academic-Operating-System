"use client"

import useSWR from "swr"

/** A lesson document attachment. */
export interface LessonDoc {
    id: string
    title: string
    /** Human size label, e.g. "1.2 MB". */
    sizeLabel: string
}

/** An end-of-chapter challenge teaser shown at the bottom of the player. */
export interface LessonChallenge {
    id: string
    title: string
    questionCount: number
}

/** The lesson currently open in the player (§4, mock until BE lands). */
export interface LessonView {
    id: string
    title: string
    /** Short prose shown on the "Bài giảng" tab. */
    overview: string
    docs: Array<LessonDoc>
    prevId: string | null
    nextId: string | null
    /** Server-side completion (a real BE would derive this per user). */
    isCompleted: boolean
    /** The challenge unlocked at the end of the lesson's chapter (null = none). */
    challenge: LessonChallenge | null
}

/** One lesson row in the curriculum rail. */
export interface OutlineLesson {
    id: string
    title: string
    durationLabel: string
    isPremium?: boolean
    isCompleted: boolean
}

/** One chapter (section) grouping lessons in the curriculum rail. */
export interface OutlineSection {
    id: string
    title: string
    lessons: Array<OutlineLesson>
}

// ponytail: mock BE — no lesson/outline endpoint yet. Deterministic outline so the rail,
// progress, prev/next and the active-lesson highlight all render from one shape. Swap for
// real GraphQL (lesson(id) + courseOutline(courseId)) when the contract lands; the hook API
// and the returned shapes stay identical.
const OUTLINE: Array<OutlineSection> = [
    {
        id: "s1",
        title: "Chương 1 — Nhập môn",
        lessons: [
            { id: "l1", title: "Giới thiệu ngôn ngữ C", durationLabel: "8:20", isCompleted: true },
            { id: "l2", title: "Biến & kiểu dữ liệu", durationLabel: "12:05", isCompleted: true },
        ],
    },
    {
        id: "s2",
        title: "Chương 2 — Điều khiển & Hàm",
        lessons: [
            { id: "l3", title: "Câu lệnh điều kiện", durationLabel: "10:40", isCompleted: false },
            { id: "l4", title: "Vòng lặp", durationLabel: "6:40", isCompleted: false },
            { id: "l5", title: "Hàm", durationLabel: "14:15", isCompleted: false, isPremium: true },
        ],
    },
]

const fetchLessonMock = async (courseId: string, lessonId: string) => {
    const flat = OUTLINE.flatMap((section) => section.lessons)
    const index = flat.findIndex((lesson) => lesson.id === lessonId)
    const current = index >= 0 ? flat[index] : flat[0]

    const lesson: LessonView = {
        id: current.id,
        title: current.title,
        overview:
            "Bài giảng trình bày khái niệm, ví dụ minh hoạ và một vài lưu ý thường gặp. Xem video rồi tải tài liệu để luyện thêm.",
        docs: [
            { id: "d1", title: "Slide bài giảng.pdf", sizeLabel: "1.2 MB" },
            { id: "d2", title: "Source code ví dụ.zip", sizeLabel: "34 KB" },
        ],
        prevId: index > 0 ? flat[index - 1].id : null,
        nextId: index >= 0 && index < flat.length - 1 ? flat[index + 1].id : null,
        isCompleted: current.isCompleted,
        challenge: { id: `challenge-${courseId}`, title: "Challenge chương 2", questionCount: 5 },
    }

    const done = flat.filter((item) => item.isCompleted).length
    return { lesson, outline: OUTLINE, progress: { done, total: flat.length }, course: { code: courseId.toUpperCase(), name: "Lập trình C" } }
}

/** Loads a lesson + the course outline + progress. Mocked; SWR-shaped for a BE swap. */
export const useQueryLessonSwr = (courseId: string, lessonId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["lesson", courseId, lessonId],
        () => fetchLessonMock(courseId, lessonId),
    )
    return {
        lesson: data?.lesson,
        outline: data?.outline ?? [],
        progress: data?.progress ?? { done: 0, total: 0 },
        course: data?.course,
        isLoading,
        error,
        mutate,
    }
}
