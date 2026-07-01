import type { AbstractEntity } from "./abstract"

/**
 * Per-language implementation guide (mount `# codeImplementations`).
 */
export interface CodeImplementationEntity extends AbstractEntity {
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Language key (typescript, go, csharp, …). */
    lang: string
    /** Mapping guide markdown. */
    guide: string
    /** Example code markdown. */
    example: string
}
