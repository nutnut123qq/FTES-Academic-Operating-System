"use client"

import useSWR from "swr"
import type { CourseLevel } from "./useQueryCoursesSwr"

/** A lesson in a course section (syllabus preview row). */
export interface CourseLesson {
    id: string
    title: string
    /** Human duration label, e.g. "8:20". */
    durationLabel: string
    /** Premium lessons unlock on enroll — shown with a lock in the pre-enroll preview. */
    isPremium?: boolean
}

/** A course section (chapter) grouping lessons. */
export interface CourseSection {
    id: string
    title: string
    lessons: Array<CourseLesson>
}

/** A single learner review. */
export interface CourseReview {
    id: string
    author: string
    /** 1–5 stars. */
    rating: number
    text: string
}

/** Course price. VND is the charged currency; USD is a reference figure. */
export interface CoursePrice {
    vnd: number
    usd: number
    /** Pre-discount VND — struck through by {@link PriceTag} when greater than `vnd`. */
    originalVnd?: number
}

/** A single instructor credential or achievement line. */
export interface CourseInstructorAchievement {
    id: string
    /** Phosphor icon key mapped to an icon component in the UI. */
    icon: string
    text: string
}

/** Instructor headline stats. */
export interface CourseInstructorStats {
    /** Number of courses taught. */
    courses: number
    /** Total learners across all courses. */
    students: number
    /** Average rating (0–5). */
    rating: number
}

/** Optional instructor social / contact links. */
export interface CourseInstructorLinks {
    github?: string
    linkedin?: string
    website?: string
}

/** The course instructor identity shown on the detail page. */
export interface CourseInstructor {
    name: string
    /** Formal title, e.g. "Giảng viên Kỹ thuật phần mềm". */
    title: string
    /** Display role line, e.g. degree + affiliation. */
    role: string
    bio: string
    /** Uploaded avatar URL; empty → fallback to generated avatar / initials. */
    avatarUrl?: string
    stats: CourseInstructorStats
    achievements: Array<CourseInstructorAchievement>
    links?: CourseInstructorLinks
}

/** Full course detail (§4, mock until BE lands). */
export interface CourseDetail {
    id: string
    code: string
    name: string
    level: CourseLevel
    credits: number
    description: string
    /** Total learning-time label, e.g. "6 giờ". */
    durationLabel: string
    price: CoursePrice
    rating: { avg: number; count: number }
    whatYouLearn: Array<string>
    instructor: CourseInstructor
    sections: Array<CourseSection>
    reviews: Array<CourseReview>
}

// ponytail: mock BE — no course endpoint yet. Derives from the id so any course renders.
// Swap for a real GraphQL query (course(id)) when the contract lands; the hook API + the
// CourseDetail shape stay identical, so CourseDetail needs no change.
const fetchCourseDetailMock = async (courseId: string): Promise<CourseDetail> => ({
    id: courseId,
    code: courseId.toUpperCase(),
    name: "Lập trình C",
    level: "basic",
    credits: 3,
    description:
        "Nhập môn lập trình với ngôn ngữ C: cú pháp, con trỏ, cấu trúc dữ liệu cơ bản và quản lý bộ nhớ. Có bài tập thực hành và đề thi mẫu.",
    durationLabel: "6 giờ",
    price: { vnd: 1_200_000, usd: 49, originalVnd: 1_600_000 },
    rating: { avg: 4.8, count: 1240 },
    whatYouLearn: [
        "Cú pháp C, biến và kiểu dữ liệu",
        "Con trỏ và quản lý bộ nhớ",
        "Cấu trúc dữ liệu cơ bản",
        "Đệ quy và hàm",
        "Debug và đọc lỗi trình biên dịch",
        "Luyện với đề thi mẫu",
    ],
    instructor: {
        name: "Lê Minh Quân",
        title: "Giảng viên Kỹ thuật phần mềm",
        role: "Thạc sĩ · Đại học FPT",
        bio: "Hơn 10 năm dạy lập trình nền tảng cho sinh viên ngành CNTT. Từng làm việc tại nhiều công ty phần mềm và hiện tập trung vào phương pháp dạy lập trình thực hành, giúp người mới vượt qua nỗi sợ code và xây dựng tư duy giải quyết vấn đề bền vững.",
        avatarUrl: "",
        stats: { courses: 12, students: 3400, rating: 4.8 },
        achievements: [
            { id: "a1", icon: "certificate", text: "Chứng chỉ AWS Certified Developer" },
            { id: "a2", icon: "trophy", text: "12 năm kinh nghiệm dạy lập trình nền tảng" },
            { id: "a3", icon: "book", text: "Tác giả bộ tài liệu ôn thi PRF192 / PRO192" },
        ],
        links: {
            github: "https://github.com/lmquan",
            linkedin: "https://linkedin.com/in/lmquan",
            website: "https://lmquan.dev",
        },
    },
    sections: [
        {
            id: "s1",
            title: "Chương 1 — Nhập môn",
            lessons: [
                { id: "l1", title: "Giới thiệu ngôn ngữ C", durationLabel: "8:20" },
                { id: "l2", title: "Biến & kiểu dữ liệu", durationLabel: "12:05" },
            ],
        },
        {
            id: "s2",
            title: "Chương 2 — Điều khiển & Hàm",
            lessons: [
                { id: "l3", title: "Câu lệnh điều kiện", durationLabel: "10:40" },
                { id: "l4", title: "Vòng lặp", durationLabel: "6:40" },
                { id: "l5", title: "Hàm", durationLabel: "14:15", isPremium: true },
            ],
        },
    ],
    reviews: [
        {
            id: "r1",
            author: "Minh",
            rating: 5,
            text: "Giải thích con trỏ rất dễ hiểu, bài tập sát đề thi.",
        },
        {
            id: "r2",
            author: "Lan",
            rating: 4,
            text: "Nội dung chắc, mong có thêm bài về cấp phát động.",
        },
    ],
})

/** Loads a course's detail. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryCourseDetailSwr = (courseId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["course-detail", courseId],
        () => fetchCourseDetailMock(courseId),
    )
    return { course: data, isLoading, error, mutate }
}
