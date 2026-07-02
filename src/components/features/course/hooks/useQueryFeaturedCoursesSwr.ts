"use client"

import useSWR from "swr"
import { useLocale } from "next-intl"
import type { Course } from "./useQueryCoursesSwr"

/** A featured course promoted in the catalog hero slider (§4, mock until BE lands). */
export interface FeaturedCourse extends Course {
    /** One-line marketing pitch shown on the slide (localized). */
    pitch: string
    /** Charged price in VND (rendered in the house VND-primary format). */
    priceVnd: number
    /** Cover image URL; a CSS gradient renders behind it as a fallback. */
    coverUrl: string
}

/** Raw mock row — pitch per locale; the hook flattens it for the active locale. */
interface FeaturedCourseMockRow extends Omit<FeaturedCourse, "pitch"> {
    pitch: { vi: string; en: string }
}

// ponytail: mock BE — no featured endpoint yet. Deterministic 4 items; the featured
// selection rule (manual flag vs top-N) is BE's call later. Covers are picsum
// placeholders — the slide keeps a gradient behind them so offline 404s stay pretty.
const FEATURED_ROWS: Array<FeaturedCourseMockRow> = [
    {
        id: "prf192",
        code: "PRF192",
        name: "Lập trình C",
        level: "basic",
        credits: 3,
        lessons: 24,
        priceVnd: 1_200_000,
        coverUrl: "https://picsum.photos/seed/prf192/1200/500",
        pitch: {
            vi: "Nền tảng lập trình đầu tiên: cú pháp C, con trỏ và bộ nhớ — học chắc để đi xa.",
            en: "Your first programming foundation: C syntax, pointers and memory — learn it right.",
        },
    },
    {
        id: "csd201",
        code: "CSD201",
        name: "Cấu trúc dữ liệu & Giải thuật",
        level: "intermediate",
        credits: 3,
        lessons: 30,
        priceVnd: 1_500_000,
        coverUrl: "https://picsum.photos/seed/csd201/1200/500",
        pitch: {
            vi: "Tư duy giải thuật bài bản với bài tập sát đề thi — môn xương sống của lập trình viên.",
            en: "Structured algorithmic thinking with exam-grade practice — the backbone course.",
        },
    },
    {
        id: "prj301",
        code: "PRJ301",
        name: "Lập trình Java Web",
        level: "intermediate",
        credits: 3,
        lessons: 28,
        priceVnd: 1_500_000,
        coverUrl: "https://picsum.photos/seed/prj301/1200/500",
        pitch: {
            vi: "Dựng ứng dụng web hoàn chỉnh với Java: servlet, JSP và kết nối cơ sở dữ liệu.",
            en: "Build complete web apps with Java: servlets, JSP and database integration.",
        },
    },
    {
        id: "swp391",
        code: "SWP391",
        name: "Đồ án phần mềm",
        level: "advanced",
        credits: 4,
        lessons: 16,
        priceVnd: 1_800_000,
        coverUrl: "https://picsum.photos/seed/swp391/1200/500",
        pitch: {
            vi: "Làm đồ án như một team thật: quy trình, review code và bàn giao sản phẩm.",
            en: "Ship a capstone like a real team: process, code review and product delivery.",
        },
    },
]

// ponytail: mock BE — flattens the per-locale pitch for the active locale.
const fetchFeaturedCoursesMock = async (locale: string): Promise<Array<FeaturedCourse>> =>
    FEATURED_ROWS.map((row) => ({
        ...row,
        pitch: locale === "en" ? row.pitch.en : row.pitch.vi,
    }))

/**
 * Loads the featured courses for the catalog hero slider. Mocked; SWR-shaped for a
 * drop-in BE swap. Key includes the locale so pitches never bleed across locales.
 * `featured` stays `undefined` while loading so callers can gate a skeleton on `!data`.
 */
export const useQueryFeaturedCoursesSwr = () => {
    const locale = useLocale()
    const { data, isLoading, error } = useSWR(["featured-courses", locale], () =>
        fetchFeaturedCoursesMock(locale),
    )
    return { featured: data, isLoading, error }
}
