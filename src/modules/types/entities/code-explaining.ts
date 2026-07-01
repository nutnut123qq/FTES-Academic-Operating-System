import type { AbstractEntity } from "./abstract"

/**
 * Critical code snippet with explanation (mount `# codeExplaining` → `codeExplainings` on entity).
 */
export interface CodeExplainingEntity extends AbstractEntity {
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Fence language inferred from code block (e.g. typescript). */
    lang: string
    /** Markdown code fence body. */
    code: string
    /** Short explanation prose (markdown). */
    explain: string
}
