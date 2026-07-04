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

/** One line item in a tier's "what's included" list. */
export interface CourseEnrollmentPlanInclude {
    /** i18n key under `courseSystem.detail.planIncludes`. */
    key: string
    /** Optional interpolation values for the i18n message. */
    params?: Record<string, string | number>
}

/** A single enrollment tier (Free / Premium) shown in the purchase card. */
export interface CourseEnrollmentPlan {
    /** i18n key for the tier name under `courseSystem.detail.planNames`. */
    name: string
    /** Optional i18n key for a badge (e.g. "Phổ biến"). */
    badge?: string
    /** Price of this tier in VND (0 for Free). */
    priceVnd: number
    /** Optional pre-discount price for this tier. */
    originalPriceVnd?: number
    /** Benefit rows rendered under the tier. */
    includes: Array<CourseEnrollmentPlanInclude>
}

/** Enrollment state of the current viewer for this course.
 *
 * ponytail: mock-only until the BE course enrollment contract lands. */
export interface CourseEnrollmentState {
    /** True when the viewer has any enrollment (free or paid). */
    isEnrolled: boolean
    /** True only for a purchased (premium) enrollment. */
    isPurchased: boolean
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
    /** Numeric total learning hours — optional until the BE course contract lands. */
    durationHours?: number
    price: CoursePrice
    rating: { avg: number; count: number }
    /** Total learners enrolled — optional until the BE course contract lands. */
    enrollmentCount?: number
    /** Total challenges in the course — optional until the BE course contract lands. */
    challengeCount?: number
    /** Enrollment state of the current viewer. Optional / mock until BE lands. */
    enrollment?: CourseEnrollmentState
    /** Free and Premium enrollment tiers shown in the purchase card. Mock until BE lands. */
    plans: {
        free: CourseEnrollmentPlan
        premium: CourseEnrollmentPlan
    }
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
    // mock: chờ BE durationHours / challengeCount / enrollmentCount
    durationHours: 33,
    challengeCount: 348,
    enrollmentCount: 49,
    price: { vnd: 1_200_000, usd: 49, originalVnd: 1_600_000 },
    // ponytail: mock enrollment state. Default false so the sales card shows the Free/Premium selector.
    // Toggle isEnrolled to true to test the "Continue learning" state.
    enrollment: { isEnrolled: false, isPurchased: false },
    // ponytail: mock Free / Premium tiers. BE will eventually own this shape.
    plans: {
        free: {
            name: "free",
            priceVnd: 0,
            includes: [
                { key: "previewVideo", params: { duration: "6 giờ" } },
                { key: "previewLessons", params: { count: 2 } },
                { key: "freeChallenge" },
            ],
        },
        premium: {
            name: "premium",
            badge: "recommended",
            priceVnd: 1_200_000,
            originalPriceVnd: 1_600_000,
            includes: [
                { key: "fullVideo", params: { duration: "6 giờ" } },
                { key: "allLessons", params: { count: 5 } },
                { key: "allChallenges" },
                { key: "certificate" },
            ],
        },
    },
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
