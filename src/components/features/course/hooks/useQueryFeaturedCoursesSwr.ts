"use client"

import useSWR from "swr"
import { useLocale } from "next-intl"
import { useGetAdminPublicBannersSwr } from "@/hooks/swr/api/rest/queries/useGetAdminPublicBannersSwr"
import type { AdminBannerView } from "@/modules/api/rest/admin"
import { CATALOG_CATEGORY_SLUG } from "./useQueryCoursesSwr"
import type { Course } from "./useQueryCoursesSwr"

/** A featured course promoted in the catalog hero slider (§4, mock until BE lands). */
export interface FeaturedCourse extends Course {
    /** One-line marketing pitch shown on the slide (localized). */
    pitch: string
    /** Charged price in VND (rendered in the house VND-primary format). */
    priceVnd: number
    /** Cover image URL; a CSS gradient renders behind it as a fallback. */
    coverUrl: string
    /**
     * Destination for the slide CTA. A real banner carries its own `linkUrl`
     * here; mock course rows leave it unset and fall back to `/courses/[id]`.
     */
    href?: string
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
        category: "programming",
        priceVnd: 1_200_000,
        coverUrl: "https://picsum.photos/seed/prf192/1600/668",
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
        category: "programming",
        priceVnd: 1_500_000,
        coverUrl: "https://picsum.photos/seed/csd201/1600/668",
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
        category: "programming",
        priceVnd: 1_500_000,
        coverUrl: "https://picsum.photos/seed/prj301/1600/668",
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
        category: "programming",
        priceVnd: 1_800_000,
        coverUrl: "https://picsum.photos/seed/swp391/1600/668",
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

/** Public banner placement queried for the catalog hero (real BE endpoint). */
const FEATURED_BANNER_PLACEMENT = "courses"

/**
 * Adapts a real public banner into the slide model. A banner only carries an
 * image, title and optional link, so the course-only fields (code, level, pitch,
 * price) stay empty/zero — {@link FeaturedSlide} hides those, degrading to a clean
 * cover + title + CTA. The CTA points at the banner's own `linkUrl` via `href`.
 */
const toFeaturedFromBanner = (banner: AdminBannerView): FeaturedCourse => ({
    id: banner.id,
    code: "",
    name: banner.title,
    level: "intermediate",
    credits: 0,
    lessons: 0,
    category: CATALOG_CATEGORY_SLUG,
    priceVnd: 0,
    coverUrl: banner.imageUrl,
    pitch: "",
    href: banner.linkUrl,
})

/**
 * Loads the featured slides for the catalog hero slider. Prefers the REAL public
 * banners endpoint (`GET /admin-content/banners?placement=courses`) and falls back
 * to the mock {@link FEATURED_ROWS} whenever that endpoint is empty or errors —
 * so the slider is never blank and quietly upgrades the moment BE seeds a banner.
 *
 * The decision waits for the banner request to settle (never flashing mock→real),
 * and `featured` stays `undefined` while it is in flight so callers can gate a
 * skeleton on `!data`.
 */
export const useQueryFeaturedCoursesSwr = () => {
    const locale = useLocale()

    const {
        data: banners,
        isLoading: bannersLoading,
        error: bannersError,
    } = useGetAdminPublicBannersSwr(FEATURED_BANNER_PLACEMENT)

    const { data: mock } = useSWR(["featured-courses", locale], () =>
        fetchFeaturedCoursesMock(locale),
    )

    // Only decide once the banner request has resolved (or errored). A non-empty
    // list wins; empty or errored → the mock rows.
    const bannersSettled = !bannersLoading
    const realBanners =
        bannersSettled && !bannersError && banners && banners.length > 0 ? banners : null

    const featured = !bannersSettled
        ? undefined
        : realBanners
            ? realBanners.map(toFeaturedFromBanner)
            : mock

    return { featured, isLoading: !featured, error: undefined }
}
