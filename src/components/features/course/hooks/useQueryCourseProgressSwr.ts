"use client"

import useSWR from "swr"

/** Course progress + completion (§4, mock until BE lands). */
export interface CourseProgress {
    completedLessons: number
    totalLessons: number
    percent: number
    certificateAvailable: boolean
}

// ponytail: mock BE — no progress endpoint yet. Deterministic sample.
const fetchCourseProgressMock = async (): Promise<CourseProgress> => {
    const completedLessons = 18
    const totalLessons = 24
    const percent = Math.round((completedLessons / totalLessons) * 100)
    return { completedLessons, totalLessons, percent, certificateAvailable: percent === 100 }
}

/** Loads a course's progress. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryCourseProgressSwr = (courseId: string) => {
    const { data, isLoading, error } = useSWR(
        ["course-progress", courseId],
        () => fetchCourseProgressMock(),
    )
    return { progress: data, isLoading, error }
}
