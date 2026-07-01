import type { AbstractEntity } from "./abstract"
import type { ModuleEntity } from "./module"

/**
 * One preview content line item in a module.
 */
export interface PreviewContentEntity extends AbstractEntity {
    /** The text of the preview line item (HTML or plain text). */
    text: string
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Parent module. */
    module?: ModuleEntity
}

