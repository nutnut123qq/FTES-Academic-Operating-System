import type { AbstractEntity } from "./abstract"

/**
 * Foundation category grouping (e.g. Docker, Kubernetes).
 */
export interface FoundationCategoryEntity extends AbstractEntity {
    /** Human-facing stable identifier. */
    displayId: string
    /** Category title (locale-resolved). */
    title: string
    /** Optional short description. */
    description?: string | null
    /** SEO slug for routing. */
    slug?: string | null
    /** Cover image URL. */
    thumbnailUrl?: string | null
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
}
