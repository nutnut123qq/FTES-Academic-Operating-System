"use client"

import useSWR from "swr"

/** Course level. */
export type CourseLevel = "basic" | "intermediate" | "advanced"

/** A course in the catalog (§4, mock until BE lands). */
export interface Course {
    id: string
    code: string
    name: string
    level: CourseLevel
    credits: number
    lessons: number
}

// ponytail: mock BE — no course endpoint yet. Deterministic sample.
const fetchCoursesMock = async (): Promise<Array<Course>> => [
    { id: "prf192", code: "PRF192", name: "Lập trình C", level: "basic", credits: 3, lessons: 24 },
    { id: "csd201", code: "CSD201", name: "Cấu trúc dữ liệu & Giải thuật", level: "intermediate", credits: 3, lessons: 30 },
    { id: "prj301", code: "PRJ301", name: "Lập trình Java Web", level: "intermediate", credits: 3, lessons: 28 },
    { id: "dbi202", code: "DBI202", name: "Cơ sở dữ liệu", level: "basic", credits: 3, lessons: 22 },
    { id: "swp391", code: "SWP391", name: "Đồ án phần mềm", level: "advanced", credits: 4, lessons: 16 },
    { id: "net1704", code: "NET1704", name: "Mạng máy tính", level: "intermediate", credits: 3, lessons: 26 },
]

/** Loads the course catalog. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryCoursesSwr = () => {
    const { data, isLoading, error } = useSWR(["courses"], () => fetchCoursesMock())
    return { courses: data ?? [], isLoading, error }
}
