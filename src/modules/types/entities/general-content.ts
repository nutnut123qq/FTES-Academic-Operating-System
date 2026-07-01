import type { AbstractEntity } from "./abstract"
import type { ModuleEntity } from "./module"
import type { GeneralContentSectionEntity } from "./general-content-section"

/**
 * General module material; optional full body or split into ordered sections.
 */
export interface GeneralContentEntity extends AbstractEntity {
    /** The title of the general content. */
    title: string
    /** The body of the general content. */
    body: string | null
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** The module that the general content belongs to. */
    module?: ModuleEntity
    /** The sections of the general content. */
    sections?: Array<GeneralContentSectionEntity>
}
