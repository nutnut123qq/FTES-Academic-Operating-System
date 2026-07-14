"use client"

import useSWR from "swr"
import { useLocale } from "next-intl"
import { useGetAdminPublicBannersSwr } from "@/hooks/swr/api/rest/queries/useGetAdminPublicBannersSwr"
import type { AdminBannerView } from "@/modules/api/rest/admin"
import type { Course } from "./useQueryCoursesSwr"

/** A featured course promoted in the catalog hero slider (§4). */
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
    /** CTA button label from the banner; the slide falls back to the i18n default when absent. */
    ctaLabel?: string
    /**
     * CSS color / gradient string painted behind the cover (banner `theme`). Rendered
     * verbatim via `style.background` (never interpolated as HTML); absent → neutral gradient.
     */
    theme?: string
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
 * Adapts a real public banner into the slide model. A banner carries an image,
 * title, and now an optional `subtitle` (pitch), `ctaText`, and `theme`; the
 * course-only fields (code, level, price) stay empty/zero — {@link FeaturedSlide}
 * hides those, degrading to a clean themed cover + title + pitch + CTA. The CTA
 * points at the banner's own `linkUrl` via `href`.
 */
const toFeaturedFromBanner = (banner: AdminBannerView): FeaturedCourse => ({
    id: banner.id,
    code: "",
    name: banner.title,
    level: "intermediate",
    credits: 0,
    lessons: 0,
    category: "",
    priceVnd: 0,
    coverUrl: banner.imageUrl,
    pitch: banner.subtitle ?? "",
    href: banner.linkUrl,
    ctaLabel: banner.ctaText,
    theme: banner.theme,
})

/**
 * Loads the featured slides for the catalog hero slider from the REAL public
 * banners endpoint (`GET /admin-content/banners?placement=courses`). Real banners
 * are the primary source — an EMPTY (but successful) response renders the slider's
 * own empty/hidden state, NOT the mock. The mock {@link FEATURED_ROWS} is used
 * ONLY when the banner request actually ERRORS, so the page still renders.
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

    // Mock is only ever consulted on error, so it stays a lazy fallback.
    const { data: mock } = useSWR(["featured-courses", locale], () =>
        fetchFeaturedCoursesMock(locale),
    )

    // Wait for the banner request to settle before deciding (no mock→real flash).
    // Success (even empty) → the real banners; error → the mock rows.
    const bannersSettled = !bannersLoading

    const featured = !bannersSettled
        ? undefined
        : bannersError
            ? mock
            : (banners ?? []).map(toFeaturedFromBanner)

    return { featured, isLoading: !featured, error: undefined }
}
