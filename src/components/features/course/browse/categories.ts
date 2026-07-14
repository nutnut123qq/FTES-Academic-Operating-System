import type { CourseCategoryDto } from "@/modules/api/rest/course"

/**
 * A course category of the browse-by-category catalog (§4). Backend-owned
 * taxonomy: the shape is populated from `GET /api/v1/courses/categories` (see
 * {@link import("../hooks/useQueryCourseCategoriesSwr")}). `slug` is the route
 * param (`/courses/category/[slug]`) and stable identity; `id` is the opaque
 * `categoryId` the course list filters on. `name`/`description` are plain strings
 * (locale-resolved by the BE, or a single language) — NOT i18n keys, since the BE
 * owns the content.
 *
 * NOTE: this module is imported by the SERVER page (`generateMetadata` /
 * notFound), so it must stay pure data — no phosphor icon components here (they
 * call `createContext`, which breaks the react-server bundle). Icons live in
 * `./category-icons` (client-only), keyed by slug. `accent` is a presentation-only
 * tone derived from the slug (see {@link accentForSlug}).
 */
export interface CourseCategory {
    /** Opaque backend id — the `categoryId` filter on the course list. */
    id: string
    /** URL slug + stable route/identity key. */
    slug: string
    /** Display name (locale-resolved by the BE). */
    name: string
    /** One-line description for the category landing header, when the BE has one. */
    description?: string
    /** Number of published courses in the category, when the BE reports it. */
    courseCount?: number
    /** Semantic tone tinting the category's landing-page icon tile (IconTile tone). */
    accent: CategoryAccent
}

/** IconTile tone options a category can be tinted with. */
export type CategoryAccent = "accent" | "success" | "warning"

/** The accent tones a category can cycle through (presentation-only). */
const ACCENTS: Array<CategoryAccent> = ["accent", "success", "warning"]

/**
 * Derives a stable presentation-only accent tone from a category slug. Pure and
 * deterministic (same slug → same tone) so the landing tile tint never flickers
 * across renders. This is the taxonomy-independent "accent helper" the browse UI
 * keeps after the BE swap.
 *
 * @param slug - The category slug.
 * @returns One of the {@link CategoryAccent} tones.
 */
export const accentForSlug = (slug: string): CategoryAccent => {
    let hash = 0
    for (let index = 0; index < slug.length; index += 1) {
        hash = (hash * 31 + slug.charCodeAt(index)) | 0
    }
    return ACCENTS[Math.abs(hash) % ACCENTS.length]
}

/**
 * Adapts a public {@link CourseCategoryDto} into the browse-view
 * {@link CourseCategory}, attaching the derived presentation accent. Used by both
 * the client hook and the server category page so the shape stays identical.
 *
 * @param dto - One BE category row.
 * @returns The browse-view category.
 */
export const toCourseCategory = (dto: CourseCategoryDto): CourseCategory => ({
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    description: dto.description,
    courseCount: dto.courseCount,
    accent: accentForSlug(dto.slug),
})
