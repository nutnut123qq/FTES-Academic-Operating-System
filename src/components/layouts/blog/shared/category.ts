import type { BlogCategoryResponse } from "@/modules/api/rest/blog"

/** HeroUI Chip colors a blog category chip can be tinted with. */
export type BlogChipColor = "accent" | "success" | "warning" | "danger" | "default"

/** The chip colors a category cycles through (presentation-only). */
const CHIP_COLORS: Array<BlogChipColor> = ["accent", "danger", "success", "warning", "default"]

/**
 * Derives a stable presentation-only chip color from a category key (its `slug`
 * or `id`). Pure and deterministic (same key → same color) so a category's chip
 * keeps one color across the list, detail, and related strips. Replaces the old
 * per-editorial-pillar color map now that the taxonomy is backend-owned.
 *
 * @param key - The category slug or id (empty/unknown → the first color).
 * @returns A HeroUI Chip color.
 */
export const blogCategoryColor = (key: string): BlogChipColor => {
    if (!key) return CHIP_COLORS[0]
    let hash = 0
    for (let index = 0; index < key.length; index += 1) {
        hash = (hash * 31 + key.charCodeAt(index)) | 0
    }
    return CHIP_COLORS[Math.abs(hash) % CHIP_COLORS.length]
}

/** A category-name + slug lookup keyed by the opaque `categoryId` carried on posts. */
export interface BlogCategoryLookup {
    /** Category display name for a post's `categoryId`, or `undefined` when unknown. */
    nameOf: (categoryId: string) => string | undefined
    /** Category slug for a post's `categoryId`, or `undefined` when unknown. */
    slugOf: (categoryId: string) => string | undefined
}

/**
 * Builds a {@link BlogCategoryLookup} from the category list so post rows can
 * resolve their `categoryId` → display name / slug without each row refetching.
 *
 * @param categories - The categories from `getBlogCategories` (may be undefined
 *   while loading).
 * @returns A lookup with `nameOf` / `slugOf` resolvers.
 */
export const buildCategoryLookup = (
    categories: Array<BlogCategoryResponse> | undefined,
): BlogCategoryLookup => {
    const byId = new Map((categories ?? []).map((category) => [category.id, category]))
    return {
        nameOf: (categoryId) => byId.get(categoryId)?.name,
        slugOf: (categoryId) => byId.get(categoryId)?.slug,
    }
}
