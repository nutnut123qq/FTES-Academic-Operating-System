"use client"

import useSWR from "swr"
import type { CourseLevel } from "./useQueryCoursesSwr"

/** A lesson in a course section. */
export interface CourseLesson {
    id: string
    title: string
}

/** A course section. */
export interface CourseSection {
    id: string
    title: string
    lessons: Array<CourseLesson>
}

/** Full course detail (§4, mock until BE lands). */
export interface CourseDetail {
    id: string
    code: string
    name: string
    level: CourseLevel
    credits: number
    description: string
    sections: Array<CourseSection>
}

// ponytail: mock BE — no course endpoint yet. Derives from the id so any course renders.
const fetchCourseDetailMock = async (courseId: string): Promise<CourseDetail> => ({
    id: courseId,
    code: courseId.toUpperCase(),
    name: "Lập trình C",
    level: "basic",
    credits: 3,
    description: "Nhập môn lập trình với ngôn ngữ C: cú pháp, con trỏ, cấu trúc dữ liệu cơ bản và quản lý bộ nhớ. Có bài tập thực hành và đề thi mẫu.",
    sections: [
        {
            id: "s1",
            title: "Chương 1 — Nhập môn",
            lessons: [
                { id: "l1", title: "Giới thiệu ngôn ngữ C" },
                { id: "l2", title: "Biến & kiểu dữ liệu" },
            ],
        },
        {
            id: "s2",
            title: "Chương 2 — Điều khiển & Hàm",
            lessons: [
                { id: "l3", title: "Câu lệnh điều kiện" },
                { id: "l4", title: "Vòng lặp" },
                { id: "l5", title: "Hàm" },
            ],
        },
    ],
})

/** Loads a course's detail. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryCourseDetailSwr = (courseId: string) => {
    const { data, isLoading, error } = useSWR(
        ["course-detail", courseId],
        () => fetchCourseDetailMock(courseId),
    )
    return { course: data, isLoading, error }
}
