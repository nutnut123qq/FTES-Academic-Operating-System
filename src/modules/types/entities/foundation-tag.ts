import type { AbstractEntity } from "./abstract"

/**
 * Tag attached to a foundation item.
 */
export interface FoundationTagEntity extends AbstractEntity {
    /** Display value (locale-resolved). */
    value: string
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Parent foundation id. */
    foundationId: string
}
