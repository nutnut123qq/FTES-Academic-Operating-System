import type { AbstractEntity } from "./abstract"
import type { GeneralContentEntity } from "./general-content"

/**
 * Section (heading + markdown body) inside general module content.
 */
export interface GeneralContentSectionEntity extends AbstractEntity {
    /** The title of the section. */
    title: string | null
    /** The body of the section. */
    body: string
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** The general content that the section belongs to. */
    generalContent?: GeneralContentEntity
}
