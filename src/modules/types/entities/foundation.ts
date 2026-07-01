import type { AbstractEntity } from "./abstract"
import type { FoundationKind } from "../enums/foundation-kind"
import type { FoundationTagEntity } from "./foundation-tag"

/**
 * Single foundation learning resource within a category.
 */
export interface FoundationEntity extends AbstractEntity {
    /** Human-facing stable identifier. */
    displayId: string
    /** Item title (locale-resolved). */
    title: string
    /** Optional description. */
    description?: string | null
    /** Resource kind. */
    kind: FoundationKind
    /** URL or markdown body depending on kind. */
    value?: string | null
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Highlight as recommended in the list UI. */
    isRecommended: boolean
    /** Author or source attribution. */
    author?: string | null
    /** Optional cover image URL (e.g. playlist thumbnail). */
    thumbnailUrl?: string | null
    /** Tags for display and filtering. */
    tags?: Array<FoundationTagEntity>
    /** Parent category id. */
    categoryId: string
}
