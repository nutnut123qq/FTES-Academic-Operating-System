/**
 * A course category of the browse-by-category catalog (§4). Frontend-defined,
 * BE-ready shape: `slug` is the join key on courses AND the route param
 * (`/courses/category/[slug]`), so it stays stable across the BE swap.
 * `name`/`description` are localized in-data (not i18n keys) because BE will
 * own the taxonomy — the swap replaces this whole list.
 *
 * NOTE: this module is imported by the SERVER page (`generateStaticParams` /
 * `generateMetadata`), so it must stay pure data — no phosphor icon components
 * here (they call `createContext`, which breaks the react-server bundle).
 * Icons live in `./category-icons` (client-only), keyed by slug.
 */
export interface CourseCategory {
    /** Stable id (mirrors what a BE row id will be). */
    id: string
    /** URL slug + join key on `Course.category`. */
    slug: string
    /** Localized display name. */
    name: { vi: string; en: string }
    /** Localized one-line description for the category landing header. */
    description: { vi: string; en: string }
    /** Semantic tone tinting the category's landing-page icon tile (IconTile tone). */
    accent: "accent" | "success" | "warning"
}

// ponytail: mock BE — no category endpoint yet. This list is THE swap point:
// when the BE category endpoint lands, replace it (and the fetcher in
// useQueryCourseCategoriesSwr) with the real data; slugs are the stable contract.
export const COURSE_CATEGORIES: Array<CourseCategory> = [
    {
        id: "cat-math",
        slug: "math",
        name: { vi: "Toán", en: "Math" },
        description: {
            vi: "Nền tảng toán cao cấp, xác suất thống kê cho kỹ sư.",
            en: "Advanced mathematics and statistics foundations for engineers.",
        },
        accent: "accent",
    },
    {
        id: "cat-programming",
        slug: "programming",
        name: { vi: "Lập trình", en: "Programming" },
        description: {
            vi: "Từ nền tảng C tới web, cơ sở dữ liệu và đồ án phần mềm.",
            en: "From C foundations to web, databases and software capstones.",
        },
        accent: "success",
    },
    {
        id: "cat-foreign-languages",
        slug: "foreign-languages",
        name: { vi: "Ngoại ngữ", en: "Foreign Languages" },
        description: {
            vi: "Tiếng Anh học thuật và tiếng Nhật cho môi trường làm việc.",
            en: "Academic English and workplace Japanese.",
        },
        accent: "warning",
    },
]

/**
 * Finds a category by its URL slug.
 *
 * @param slug - The category slug from the route / course row.
 * @returns The matching category, or `undefined` for an unknown slug.
 */
export const findCategoryBySlug = (slug: string): CourseCategory | undefined =>
    COURSE_CATEGORIES.find((category) => category.slug === slug)

/**
 * Picks the localized category name for the active locale.
 *
 * @param category - The category to name.
 * @param locale - The active locale ("vi" | "en").
 * @returns The category name in that locale.
 */
export const categoryName = (category: CourseCategory, locale: string): string =>
    locale === "en" ? category.name.en : category.name.vi

/**
 * Picks the localized category description for the active locale.
 *
 * @param category - The category to describe.
 * @param locale - The active locale ("vi" | "en").
 * @returns The category description in that locale.
 */
export const categoryDescription = (category: CourseCategory, locale: string): string =>
    locale === "en" ? category.description.en : category.description.vi
